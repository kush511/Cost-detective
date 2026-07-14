function buildAwsCommand(parts, options = {}) {
  const command = ['aws', ...parts];

  if (options.region) {
    command.push('--region', options.region);
  }

  if (options.output !== false) {
    command.push('--output', options.output || 'json');
  }

  return command.join(' ');
}

function awsVersionCommand() {
  return 'aws --version';
}

function getCallerIdentityCommand() {
  return buildAwsCommand(['sts', 'get-caller-identity']);
}

function describeRegionsCommand() {
  return buildAwsCommand(['ec2', 'describe-regions']);
}

function describeInstancesCommand(region) {
  return buildAwsCommand(['ec2', 'describe-instances'], { region });
}

function describeVolumesCommand(region) {
  return buildAwsCommand(['ec2', 'describe-volumes'], { region });
}

function describeAddressesCommand(region) {
  return buildAwsCommand(['ec2', 'describe-addresses'], { region });
}

function describeLoadBalancersCommand(region) {
  return buildAwsCommand(['elbv2', 'describe-load-balancers'], { region });
}

function describeDbInstancesCommand(region) {
  return buildAwsCommand(['rds', 'describe-db-instances'], { region });
}

function listLambdaFunctionsCommand(region) {
  return buildAwsCommand(['lambda', 'list-functions'], { region });
}

function describeVpcsCommand(region) {
  return buildAwsCommand(['ec2', 'describe-vpcs'], { region });
}

function describeAlarmsCommand(region) {
  return buildAwsCommand(['cloudwatch', 'describe-alarms'], { region });
}

function listBucketsCommand() {
  return buildAwsCommand(['s3api', 'list-buckets']);
}

function listRolesCommand() {
  return buildAwsCommand(['iam', 'list-roles']);
}

module.exports = {
  awsVersionCommand,
  getCallerIdentityCommand,
  describeRegionsCommand,
  describeInstancesCommand,
  describeVolumesCommand,
  describeAddressesCommand,
  describeLoadBalancersCommand,
  describeDbInstancesCommand,
  listLambdaFunctionsCommand,
  describeVpcsCommand,
  describeAlarmsCommand,
  listBucketsCommand,
  listRolesCommand,
};