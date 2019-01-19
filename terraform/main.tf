variable "aws_credentials_region" {}
variable "aws_credentials_shared_credentials_file" {}
variable "aws_credentials_profile" {}
variable "web_app_bucket" {}
variable "cognito_pool_name" {}

provider "aws" {
  region                  = "${var.aws_credentials_region}"
  shared_credentials_file = "${var.aws_credentials_shared_credentials_file}"
  profile                 = "${var.aws_credentials_profile}"
}

resource "aws_s3_bucket" "web_app_bucket_log" {
  bucket = "${var.web_app_bucket}.log"
  acl    = "log-delivery-write"
}

resource "aws_s3_bucket" "web_app_bucket" {
  bucket = "${var.web_app_bucket}"
  acl    = "public-read"
  website {
    index_document = "index.html"
    error_document = "error.html"
  }
  logging {
    target_bucket = "${aws_s3_bucket.web_app_bucket_log.id}"
    target_prefix = "log/"
  }
}

resource "aws_cognito_identity_pool" "briscoloker_pool" {
  identity_pool_name               = "${var.cognito_pool_name}"
  allow_unauthenticated_identities = true
}