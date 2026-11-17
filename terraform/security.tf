resource "aws_security_group" "app" {
  name        = "${var.project_name}-app-sg"
  description = "Public HTTP/HTTPS; SSH only from admin and Jenkins."
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP"
    from_port = 80
    to_port = 80
    protocol = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "HTTPS (ready for TLS configuration)"
    from_port = 443
    to_port = 443
    protocol = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "Prometheus UI restricted to administrator"
    from_port = 9090
    to_port = 9090
    protocol = "tcp"
    cidr_blocks = [var.admin_cidr]
  }
  ingress {
    description = "Grafana UI restricted to administrator"
    from_port = 3001
    to_port = 3001
    protocol = "tcp"
    cidr_blocks = [var.admin_cidr]
  }
  ingress {
    description = "SSH from administrator"
    from_port = 22
    to_port = 22
    protocol = "tcp"
    cidr_blocks = [var.admin_cidr]
  }
  ingress {
    description = "SSH from Jenkins"
    from_port = 22
    to_port = 22
    protocol = "tcp"
    security_groups = [aws_security_group.jenkins.id]
  }
  egress {
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
resource "aws_security_group" "jenkins" {
  name        = "${var.project_name}-jenkins-sg"
  description = "Jenkins UI and admin SSH restricted to configured CIDRs."
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "Jenkins UI"
    from_port = 8080
    to_port = 8080
    protocol = "tcp"
    cidr_blocks = [var.jenkins_allowed_cidr]
  }
  ingress {
    description = "Admin SSH"
    from_port = 22
    to_port = 22
    protocol = "tcp"
    cidr_blocks = [var.admin_cidr]
  }
  egress {
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
