output "app_url" {
  value = "http://${aws_eip.app.public_ip}"
}
output "jenkins_url" {
  value = "http://${aws_eip.jenkins.public_ip}:8080"
}
output "app_private_ip" {
  value = aws_instance.app.private_ip
}
output "jenkins_initial_password_command" {
  value = "ssh -i <your-admin-private-key> ubuntu@${aws_eip.jenkins.public_ip} 'sudo cat /var/lib/jenkins/secrets/initialAdminPassword'"
}
output "ssh_app_command" {
  value = "ssh -i <your-admin-private-key> ubuntu@${aws_eip.app.public_ip}"
}
output "ssh_jenkins_command" {
  value = "ssh -i <your-admin-private-key> ubuntu@${aws_eip.jenkins.public_ip}"
}
output "grafana_password" {
  value     = random_password.grafana_password.result
  sensitive = true
}
output "jwt_secret" {
  value     = random_password.jwt_secret.result
  sensitive = true
}
