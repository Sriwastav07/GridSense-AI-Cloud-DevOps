variable "aws_region" {
  description = "AWS region for GridSense infrastructure."
  type        = string
  default     = "ap-south-1"
}
variable "environment" {
  type    = string
  default = "dev"
}
variable "project_name" {
  type    = string
  default = "gridsense-ai"
}
variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}
variable "public_subnet_a_cidr" {
  type    = string
  default = "10.0.1.0/24"
}
variable "public_subnet_b_cidr" {
  type    = string
  default = "10.0.2.0/24"
}
variable "private_subnet_a_cidr" {
  type    = string
  default = "10.0.11.0/24"
}
variable "private_subnet_b_cidr" {
  type    = string
  default = "10.0.12.0/24"
}
variable "admin_cidr" {
  description = "Your public IP in CIDR notation, e.g. 203.0.113.10/32. Restricts SSH access."
  type        = string
}
variable "jenkins_allowed_cidr" {
  description = "Your public IP in CIDR notation, e.g. 203.0.113.10/32. Restricts Jenkins UI."
  type        = string
}
variable "admin_public_key" {
  description = "Contents of your existing SSH public key (for example, ~/.ssh/id_ed25519.pub)."
  type        = string
}
variable "app_instance_type" {
  type    = string
  default = "t3.small"
}
variable "jenkins_instance_type" {
  type    = string
  default = "t3.medium"
}
