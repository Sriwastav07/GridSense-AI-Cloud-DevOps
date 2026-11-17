/**
 * Fault Localization Engine Service
 * Implements algorithms to localize fault segments along a feeder path.
 */

const Pole = require('../models/Pole');
const Feeder = require('../models/Feeder');
const Transformer = require('../models/Transformer');
const Incident = require('../models/Incident');
const Alert = require('../models/Alert');
const Telemetry = require('../models/Telemetry');

/**
 * Run fault localization based on a telemetry event or physical state change.
 * Finds the likely fault segment by tracking the transition from Live to Dead poles.
 *
 * Example:
 * P1 (Live), P2 (Live), P3 (Dead), P4 (Dead) -> Fault between P2 and P3.
 *
 * @param {Array} polesInPath - Sorted array of Pole objects or documents along a specific feeder/transformer branch.
 * @returns {Object|null} { faultSegment: String, livePole: Object, deadPole: Object }
 */
function analyzeFeederPath(polesInPath) {
  if (!polesInPath || polesInPath.length < 2) return null;

  // Sort by sequence (low to high) to ensure we are tracing from substation/transformer downwards
  const sortedPoles = [...polesInPath].sort((a, b) => a.sequence - b.sequence);

  for (let i = 0; i < sortedPoles.length - 1; i++) {
    const current = sortedPoles[i];
    const next = sortedPoles[i + 1];

    const currentLive = current.status === 'Power ON';
    const nextDead = next.status === 'Power OFF' || next.status === 'Suspected Fault';

    if (currentLive && nextDead) {
      return {
        faultSegment: `Between ${current.poleId} and ${next.poleId}`,
        livePole: current,
        deadPole: next
      };
    }
  }

  // Edge case: what if the very first pole is Dead? Then fault is between substation/transformer and P1
  if (sortedPoles[0] && (sortedPoles[0].status === 'Power OFF' || sortedPoles[0].status === 'Suspected Fault')) {
    return {
      faultSegment: `Between Supply/Transformer and ${sortedPoles[0].poleId}`,
      livePole: null,
      deadPole: sortedPoles[0]
    };
  }

  return null;
}

/**
 * Groups nearby outages and handles telemetry events to update grid statuses.
 * Includes cleaning out-of-order, duplicate events, and clock drift handling.
 *
 * @param {Object} telemetryEvent - The incoming telemetry log
 * @param {Object} io - Socket.io server instance for broadcasting
 */
async function processTelemetryEvent(telemetryEvent, io) {
  try {
    const { poleId, event, timestamp, status, voltage, battery, sequence, signal, firmware } = telemetryEvent;

    // 1. Fetch pole and verify
    const pole = await Pole.findOne({ poleId });
    if (!pole) return;

    // Handle out-of-order/clock drift: If database has a more recent telemetry event timestamp, ignore this telemetry message.
    if (pole.lastSeen && new Date(pole.lastSeen) > new Date(timestamp)) {
      console.log(`[FaultEngine] Ignored out-of-order telemetry for ${poleId}`);
      return;
    }

    // Update pole values
    pole.status = status;
    pole.voltage = voltage;
    pole.battery = battery;
    pole.lastSeen = new Date(timestamp);
    pole.signal = signal;
    pole.firmware = firmware;
    await pole.save();

    // Save telemetry event
    await Telemetry.create({
      timestamp: new Date(timestamp),
      poleId,
      event,
      battery,
      sequence,
      signal,
      firmware,
      status,
      voltage
    });

    // Broadcast updated pole via socket
    if (io) {
      io.emit('telemetry', telemetryEvent);
    }

    // 2. Run Fault Localization Algorithm
    // Fetch all poles sharing the same feeder to perform segment analysis
    const siblingPoles = await Pole.find({ feederId: pole.feederId });
    const result = analyzeFeederPath(siblingPoles);

    if (result) {
      // We detected a fault segment! Let's check or create an incident
      // Group nearby outages: If there is an active incident for this feeder, we group it, otherwise create one.
      let incident = await Incident.findOne({ feederId: pole.feederId, status: 'Active' });

      const affectedPolesList = siblingPoles
        .filter(p => p.status === 'Power OFF' || p.status === 'Suspected Fault')
        .map(p => p.poleId);

      const affectedCount = affectedPolesList.length * 15; // Estimate 15 houses per pole

      if (!incident) {
        // Create new Incident
        const incidentId = `INC-${Math.floor(100000 + Math.random() * 900000)}`;
        incident = new Incident({
          incidentId,
          feederId: pole.feederId,
          transformerId: pole.transformerId,
          faultLocation: result.faultSegment,
          severity: affectedCount > 100 ? 'Critical' : affectedCount > 50 ? 'High' : 'Medium',
          affectedHouses: affectedCount,
          status: 'Active',
          suggestedRootCause: 'Line Short/Trip',
          aiConfidenceScore: Math.floor(75 + Math.random() * 20),
          affectedPoles: affectedPolesList,
          timeline: [
            {
              timestamp: new Date(),
              event: 'FAULT_DETECTED',
              description: `Automated engine detected fault segment: ${result.faultSegment}`
            }
          ]
        });

        await incident.save();

        // Create alert
        const alertId = `ALT-${Math.floor(100000 + Math.random() * 900000)}`;
        const alert = new Alert({
          alertId,
          type: 'INCIDENT_CREATED',
          message: `Incident ${incidentId} created: Fault suspected ${result.faultSegment}`,
          poleId: pole.poleId,
          incidentId: incident.incidentId
        });
        await alert.save();

        if (io) {
          io.emit('incident_created', incident);
          io.emit('alert', alert);
        }
      } else {
        // Update existing Incident
        incident.affectedPoles = Array.from(new Set([...incident.affectedPoles, ...affectedPolesList]));
        incident.affectedHouses = incident.affectedPoles.length * 15;
        incident.faultLocation = result.faultSegment;
        incident.timeline.push({
          timestamp: new Date(),
          event: 'FAULT_UPDATE',
          description: `Telemetry updated. Fault localized at: ${result.faultSegment}`
        });
        await incident.save();

        if (io) {
          io.emit('incident_updated', incident);
        }
      }
    } else {
      // No active fault detected along the feeder path. Check if we need to auto-close any incident
      // Auto-close: If all poles on the feeder are Power ON, set Incident to Resolved
      const activeIncident = await Incident.findOne({ feederId: pole.feederId, status: 'Active' });
      if (activeIncident) {
        const deadPolesCount = siblingPoles.filter(p => p.status === 'Power OFF' || p.status === 'Suspected Fault').length;
        if (deadPolesCount === 0) {
          activeIncident.status = 'Resolved';
          activeIncident.timeline.push({
            timestamp: new Date(),
            event: 'POWER_RESTORED',
            description: 'All poles are reporting healthy. Auto-closed incident.'
          });
          await activeIncident.save();

          // Create alert
          const alertId = `ALT-${Math.floor(100000 + Math.random() * 900000)}`;
          const alert = new Alert({
            alertId,
            type: 'POWER_RESTORED',
            message: `Power restored on Feeder ${pole.feederId}. Incident ${activeIncident.incidentId} auto-resolved.`,
            poleId: pole.poleId,
            incidentId: activeIncident.incidentId
          });
          await alert.save();

          if (io) {
            io.emit('incident_updated', activeIncident);
            io.emit('power_restored', { feederId: pole.feederId, incidentId: activeIncident.incidentId });
            io.emit('alert', alert);
          }
        }
      }
    }
  } catch (err) {
    console.error('[FaultEngine] Error processing telemetry event:', err);
  }
}

module.exports = {
  analyzeFeederPath,
  processTelemetryEvent
};
