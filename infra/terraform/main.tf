provider "aws" {
  region = "us-east-1"
}

variable "projectName" {
  default = "tc-70"
}

variable "arnLabRole" {
  default = "arn:aws:iam::434832190675:role/LabRole"
}

variable "vpcId" {
  default = "vpc-0a86ef74bb75e2ef8"
}

variable "subnet1" {
  default = "subnet-06ebfbd7694b42072"
}

variable "subnet2" {
  default = "subnet-05f66a4fc18404cb6"
}

resource "aws_eks_cluster" "eks_cluster" {
  name     = "eks-${var.projectName}"
  role_arn = var.arnLabRole
  version  = "1.29"

  vpc_config {
    subnet_ids = [var.subnet1, var.subnet2]
  }

  depends_on = [aws_security_group.cluster_sg]
}

resource "aws_eks_node_group" "eks_worker_node_group" {
  cluster_name    = aws_eks_cluster.eks_cluster.name
  node_group_name = "eks-node-group-${var.projectName}"
  node_role_arn   = var.arnLabRole

  scaling_config {
    min_size     = 1
    max_size     = 3
    desired_size = 1
  }

  subnet_ids = [var.subnet1, var.subnet2]

  capacity_type = "ON_DEMAND"

  instance_types = ["t3.medium"]

  depends_on = [aws_eks_cluster.eks_cluster]
}

resource "aws_security_group" "cluster_sg" {
  vpc_id = var.vpcId
}

resource "aws_apigatewayv2_api" "main" {
  name          = "main"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_stage" "api" {
  api_id = aws_apigatewayv2_api.main.id

  name        = "api"
  auto_deploy = true
}

resource "aws_security_group" "vpc_link" {
  name   = "vpc-link"
  vpc_id = var.vpcId

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_apigatewayv2_vpc_link" "eks" {
  name               = "eks"
  security_group_ids = [aws_security_group.vpc_link.id]
  subnet_ids = [var.subnet1, var.subnet2]
}

resource "aws_apigatewayv2_integration" "catalog_service" {
  api_id = aws_apigatewayv2_api.main.id

  integration_uri    = "arn:aws:elasticloadbalancing:us-east-1:434832190675:listener/net/a63fe4cd2c6484a70b9c078705a371bd/1b3d4f15ac5e01c5/e7f0a39ce21733b5"
  integration_type   = "HTTP_PROXY"
  integration_method = "ANY"
  connection_type    = "VPC_LINK"
  connection_id      = aws_apigatewayv2_vpc_link.eks.id
}

resource "aws_apigatewayv2_route" "post_products" {
  api_id = aws_apigatewayv2_api.main.id

  route_key = "POST /products"
  target    = "integrations/${aws_apigatewayv2_integration.catalog_service.id}"
}

resource "aws_apigatewayv2_route" "get_products" {
  api_id = aws_apigatewayv2_api.main.id

  route_key = "GET /products"
  target    = "integrations/${aws_apigatewayv2_integration.catalog_service.id}"
}

resource "aws_apigatewayv2_integration" "auth_service" {
  api_id = aws_apigatewayv2_api.main.id

  integration_uri    = "arn:aws:elasticloadbalancing:us-east-1:434832190675:listener/net/a5b96d0268f9f4c4c89e0911915a6b26/174bb6ac8897cc2c/d3c7b41987d71dfa"
  integration_type   = "HTTP_PROXY"
  integration_method = "ANY"
  connection_type    = "VPC_LINK"
  connection_id      = aws_apigatewayv2_vpc_link.eks.id
}

resource "aws_apigatewayv2_route" "post_users" {
  api_id = aws_apigatewayv2_api.main.id

  route_key = "POST /users"
  target    = "integrations/${aws_apigatewayv2_integration.auth_service.id}"
}

resource "aws_apigatewayv2_route" "login" {
  api_id = aws_apigatewayv2_api.main.id

  route_key = "POST /login"
  target    = "integrations/${aws_apigatewayv2_integration.auth_service.id}"
}

resource "aws_apigatewayv2_route" "exclude_data" {
  api_id = aws_apigatewayv2_api.main.id

  route_key = "POST /exclude-data"
  target    = "integrations/${aws_apigatewayv2_integration.auth_service.id}"
}

resource "aws_apigatewayv2_route" "approve_exclude_data" {
  api_id = aws_apigatewayv2_api.main.id

  route_key = "POST /approve-exclude-data"
  target    = "integrations/${aws_apigatewayv2_integration.auth_service.id}"
}

resource "aws_apigatewayv2_integration" "order_service" {
  api_id = aws_apigatewayv2_api.main.id

  integration_uri    = "arn:aws:elasticloadbalancing:us-east-1:434832190675:listener/net/a585a137f6a224c50b85665dc5f19853/ecda1c100a2a77c3/d7d1599c1dbfbeeb"
  integration_type   = "HTTP_PROXY"
  integration_method = "ANY"
  connection_type    = "VPC_LINK"
  connection_id      = aws_apigatewayv2_vpc_link.eks.id
}

resource "aws_apigatewayv2_route" "post_order" {
  api_id = aws_apigatewayv2_api.main.id

  route_key = "POST /order"
  target    = "integrations/${aws_apigatewayv2_integration.order_service.id}"
}

resource "aws_apigatewayv2_route" "get_order" {
  api_id = aws_apigatewayv2_api.main.id

  route_key = "GET /order/{order_id}"
  target    = "integrations/${aws_apigatewayv2_integration.order_service.id}"
}

resource "aws_apigatewayv2_route" "pay_order" {
  api_id = aws_apigatewayv2_api.main.id

  route_key = "POST /order/{order_id}/pay"
  target    = "integrations/${aws_apigatewayv2_integration.order_service.id}"
}

resource "aws_apigatewayv2_route" "order_callback" {
  api_id = aws_apigatewayv2_api.main.id

  route_key = "POST /order/callback"
  target    = "integrations/${aws_apigatewayv2_integration.order_service.id}"
}

output "url" {
  value = aws_apigatewayv2_stage.api.invoke_url
}
