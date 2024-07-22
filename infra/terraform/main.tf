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
    min_size     = 0
    max_size     = 3
    desired_size = 1
  }

  subnet_ids = [var.subnet1, var.subnet2]

  capacity_type = "ON_DEMAND"

  instance_types = ["t3.small"]

  depends_on = [aws_eks_cluster.eks_cluster]
}

resource "aws_security_group" "cluster_sg" {
  vpc_id = var.vpcId
}

// aqui começa

// cria api gateway
resource "aws_apigatewayv2_api" "main" {
  name          = "main"
  protocol_type = "HTTP"
}

// cria stage
resource "aws_apigatewayv2_stage" "dev" {
  api_id = aws_apigatewayv2_api.main.id

  name        = "dev"
  auto_deploy = true
}

// cria stage
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

// cria link para o EKS
resource "aws_apigatewayv2_vpc_link" "eks" {
  name               = "eks"
  security_group_ids = [aws_security_group.vpc_link.id]
  subnet_ids = [var.subnet1, var.subnet2]
}

# // configura o micro serviço
# resource "aws_apigatewayv2_integration" "eks" {
#   api_id = aws_apigatewayv2_api.main.id

#   integration_uri    = "arn:aws:elasticloadbalancing:us-east-1:434832190675:listener/net/a329d0d17bb6a43e8a50c3758bfb1b27/7156f5ef8983cf38/209284151e4c9d94"
#   integration_type   = "HTTP_PROXY"
#   integration_method = "ANY"
#   connection_type    = "VPC_LINK"
#   connection_id      = aws_apigatewayv2_vpc_link.eks.id
# }

# // configura a rota
# resource "aws_apigatewayv2_route" "get_echo" {
#   api_id = aws_apigatewayv2_api.main.id

#   route_key = "GET /echo"
#   target    = "integrations/${aws_apigatewayv2_integration.eks.id}"
# }

# // log
# output "hello_base_url" {
#   value = "${aws_apigatewayv2_stage.dev.invoke_url}/echo"
# }
