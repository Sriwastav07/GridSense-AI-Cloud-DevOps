pipeline {
  agent any
  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '15'))
    timeout(time: 40, unit: 'MINUTES')
  }
  triggers { pollSCM('H/5 * * * *') }
  environment {
    IMAGE_TAG = "${env.BUILD_NUMBER}"
    API_IMAGE = "gridsense-api"
    WEB_IMAGE = "gridsense-web"
    DEPLOY_ENV_FILE = "/var/lib/jenkins/gridsense-deploy.env"
    SSH_KEY = "/var/lib/jenkins/.ssh/gridsense_deploy_key"
    SSH_OPTS = "-o StrictHostKeyChecking=accept-new -o ConnectTimeout=15"
  }
  stages {
    stage('Checkout') {
      steps {
        checkout scm
        sh 'git log -1 --pretty="format:Commit %h by %an: %s"'
      }
    }
    stage('Pre-flight') {
      steps {
        sh '''
          set -eu
          test -f "$DEPLOY_ENV_FILE" || { echo "Missing Terraform-created $DEPLOY_ENV_FILE"; exit 1; }
          test -f "$SSH_KEY" || { echo "Missing deployment SSH key"; exit 1; }
          docker version
          node --version
        '''
      }
    }
    stage('Test backend') {
      steps {
        dir('backend') {
          sh 'npm ci'
          sh 'npm test'
        }
      }
    }
    stage('Build images') {
      steps {
        sh '''
          docker build -t ${API_IMAGE}:${IMAGE_TAG} -t ${API_IMAGE}:latest ./backend
          docker build --build-arg VITE_API_URL= -t ${WEB_IMAGE}:${IMAGE_TAG} -t ${WEB_IMAGE}:latest ./frontend
        '''
      }
    }
    stage('Transfer images and configuration') {
      steps {
        sh '''
          set -eu
          . "$DEPLOY_ENV_FILE"
          TARGET="$APP_USER@$APP_HOST"
          docker save ${API_IMAGE}:${IMAGE_TAG} ${WEB_IMAGE}:${IMAGE_TAG} | gzip | ssh -i "$SSH_KEY" $SSH_OPTS "$TARGET" 'gunzip | docker load'
          ssh -i "$SSH_KEY" $SSH_OPTS "$TARGET" "mkdir -p $APP_DIR/monitoring/grafana/provisioning/datasources"
          scp -i "$SSH_KEY" $SSH_OPTS docker-compose.yml "$TARGET:$APP_DIR/docker-compose.yml"
          scp -r -i "$SSH_KEY" $SSH_OPTS backend frontend "$TARGET:$APP_DIR/"
          scp -i "$SSH_KEY" $SSH_OPTS monitoring/prometheus.yml "$TARGET:$APP_DIR/monitoring/prometheus.yml"
          scp -i "$SSH_KEY" $SSH_OPTS monitoring/grafana/provisioning/datasources/prometheus.yml "$TARGET:$APP_DIR/monitoring/grafana/provisioning/datasources/prometheus.yml"
        '''
      }
    }
    stage('Deploy') {
      steps {
        sh '''
          set -eu
          . "$DEPLOY_ENV_FILE"
          ssh -i "$SSH_KEY" $SSH_OPTS "$APP_USER@$APP_HOST" "
            set -eu
            cd $APP_DIR
            sed -i 's|^FRONTEND_ORIGIN=.*|FRONTEND_ORIGIN=${APP_PUBLIC_URL}|' .env
            APP_IMAGE_TAG=${IMAGE_TAG} docker compose --profile monitoring up -d --no-build --remove-orphans
            docker image prune -f >/dev/null
            docker compose ps
          "
        '''
      }
    }
    stage('Smoke test') {
      steps {
        sh '''
          set -eu
          . "$DEPLOY_ENV_FILE"
          for i in $(seq 1 20); do
            if curl -fsS "$APP_PUBLIC_URL/health"; then
              echo "GridSense deployment is healthy."
              exit 0
            fi
            sleep 6
          done
          ssh -i "$SSH_KEY" $SSH_OPTS "$APP_USER@$APP_HOST" "cd $APP_DIR && docker compose logs --tail=100"
          exit 1
        '''
      }
    }
  }
  post {
    always { sh 'docker image prune -f >/dev/null 2>&1 || true' }
    success { echo "GridSense build ${env.BUILD_NUMBER} deployed successfully." }
    failure { echo "GridSense pipeline failed. Check stage logs." }
  }
}
