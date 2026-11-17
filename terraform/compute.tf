data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-noble-24.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}
resource "aws_key_pair" "admin" {
  key_name   = "${var.project_name}-admin"
  public_key = var.admin_public_key
}
resource "tls_private_key" "jenkins_deploy" {
  algorithm = "ED25519"
}
resource "random_password" "jwt_secret" {
  length  = 64
  special = false
}
resource "random_password" "grafana_password" {
  length  = 32
  special = false
}
resource "aws_instance" "app" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.app_instance_type
  subnet_id                   = aws_subnet.public_a.id
  vpc_security_group_ids      = [aws_security_group.app.id]
  key_name                    = aws_key_pair.admin.key_name
  associate_public_ip_address = true
  user_data = templatefile("${path.module}/templates/app_user_data.sh.tftpl", {
    deploy_public_key = tls_private_key.jenkins_deploy.public_key_openssh
    jwt_secret        = random_password.jwt_secret.result
    grafana_password  = random_password.grafana_password.result
  })
  root_block_device {
    volume_size           = 25
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }
  metadata_options {
    http_tokens = "required"
  }
  tags = { Name = "${var.project_name}-app" }
}
resource "aws_instance" "jenkins" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.jenkins_instance_type
  subnet_id                   = aws_subnet.public_b.id
  vpc_security_group_ids      = [aws_security_group.jenkins.id]
  key_name                    = aws_key_pair.admin.key_name
  associate_public_ip_address = true
  user_data = templatefile("${path.module}/templates/jenkins_user_data.sh.tftpl", {
    deploy_private_key = tls_private_key.jenkins_deploy.private_key_openssh
    app_private_ip     = aws_instance.app.private_ip
    app_public_ip      = aws_eip.app.public_ip
  })
  root_block_device {
    volume_size           = 30
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }
  metadata_options {
    http_tokens = "required"
  }
  tags = { Name = "${var.project_name}-jenkins" }
}
resource "aws_eip" "app" {
  domain   = "vpc"
  instance = aws_instance.app.id
}
resource "aws_eip" "jenkins" {
  domain   = "vpc"
  instance = aws_instance.jenkins.id
}
