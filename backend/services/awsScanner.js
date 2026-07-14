const executeCommand = require('../utils/executeCommand');
const {
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
} = require('./awsCommands');

const REGION_DESCRIPTIONS = {
  'af-south-1': 'Africa (Cape Town)',
  'ap-east-1': 'Asia Pacific (Hong Kong)',
  'ap-northeast-1': 'Asia Pacific (Tokyo)',
  'ap-northeast-2': 'Asia Pacific (Seoul)',
  'ap-northeast-3': 'Asia Pacific (Osaka)',
  'ap-south-1': 'Asia Pacific (Mumbai)',
  'ap-south-2': 'Asia Pacific (Hyderabad)',
  'ap-southeast-1': 'Asia Pacific (Singapore)',
  'ap-southeast-2': 'Asia Pacific (Sydney)',
  'ap-southeast-3': 'Asia Pacific (Jakarta)',
  'ap-southeast-4': 'Asia Pacific (Melbourne)',
  'ca-central-1': 'Canada (Central)',
  'ca-west-1': 'Canada West (Calgary)',
  'eu-central-1': 'Europe (Frankfurt)',
  'eu-central-2': 'Europe (Zurich)',
  'eu-north-1': 'Europe (Stockholm)',
  'eu-south-1': 'Europe (Milan)',
  'eu-south-2': 'Europe (Spain)',
  'eu-west-1': 'Europe (Ireland)',
  'eu-west-2': 'Europe (London)',
  'eu-west-3': 'Europe (Paris)',
  'il-central-1': 'Israel (Tel Aviv)',
  'me-central-1': 'Middle East (UAE)',
  'me-south-1': 'Middle East (Bahrain)',
  'sa-east-1': 'South America (Sao Paulo)',
  'us-east-1': 'US East (N. Virginia)',
  'us-east-2': 'US East (Ohio)',
  'us-west-1': 'US West (N. California)',
  'us-west-2': 'US West (Oregon)',
};

function safeJsonParse(value, fallback) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeTags(tags) {
  return toArray(tags).reduce((accumulator, tag) => {
    if (tag && tag.Key) {
      accumulator[tag.Key] = tag.Value;
    }

    return accumulator;
  }, {});
}

function getTagValue(tags, key) {
  return normalizeTags(tags)[key] || '';
}

function classifyAwsError(error) {
  const message = `${error?.stderr || ''} ${error?.message || ''}`.toLowerCase();

  if (error?.code === 'ENOENT' || message.includes('aws: not found') || message.includes('command not found')) {
    return { type: 'cli-not-installed', message: 'AWS CLI is not installed.' };
  }

  if (message.includes('could not connect to the endpoint url') || message.includes('invalid endpoint')) {
    return { type: 'invalid-region', message: 'Invalid AWS region.' };
  }

  if (message.includes('unable to locate credentials') || message.includes('no credentials were found')) {
    return { type: 'credentials-missing', message: 'AWS credentials are not configured.' };
  }

  if (message.includes('expiredtoken') || message.includes('session token') || message.includes('token has expired')) {
    return { type: 'session-expired', message: 'AWS session expired.' };
  }

  if (
    message.includes('invalidclienttokenid') ||
    message.includes('unrecognizedclientexception') ||
    message.includes('signaturedoesnotmatch') ||
    message.includes('security token included in the request is invalid')
  ) {
    return { type: 'invalid-credentials', message: 'Invalid AWS credentials.' };
  }

  if (message.includes('accessdenied') || message.includes('not authorized') || message.includes('unauthorizedoperation')) {
    return { type: 'access-denied', message: 'Access denied for this AWS action.' };
  }

  if (error?.killed || message.includes('timed out')) {
    return { type: 'timeout', message: 'AWS CLI command timed out.' };
  }

  return { type: 'unknown', message: error?.message || 'AWS CLI command failed.' };
}

function getAwsProfile() {
  return process.env.AWS_PROFILE || 'default';
}

async function runAwsCommand(command, options = {}) {
  return executeCommand(command, {
    timeout: options.timeout,
    profile: getAwsProfile(),
  });
}

async function checkAwsCliInstalled() {
  try {
    const result = await runAwsCommand(awsVersionCommand(), { timeout: 10000 });
    return {
      installed: true,
      version: (result.stdout || result.stderr || '').trim(),
    };
  } catch (error) {
    const classified = classifyAwsError(error);
    if (classified.type === 'cli-not-installed') {
      return {
        installed: false,
        message: classified.message,
      };
    }

    throw error;
  }
}

async function verifyAwsAuthentication() {
  try {
    const result = await runAwsCommand(getCallerIdentityCommand(), { timeout: 30000 });
    const parsed = safeJsonParse(result.stdout, {});

    return {
      success: true,
      accountId: parsed.Account || '',
      arn: parsed.Arn || '',
      userId: parsed.UserId || '',
      profile: getAwsProfile(),
      awsCli: 'Installed',
    };
  } catch (error) {
    const classified = classifyAwsError(error);
    return {
      success: false,
      errorType: classified.type,
      message: classified.message,
    };
  }
}

async function getHealthStatus() {
  const cliStatus = await checkAwsCliInstalled();

  if (!cliStatus.installed) {
    return {
      statusCode: 503,
      body: {
        success: false,
        message: cliStatus.message,
      },
    };
  }

  const authStatus = await verifyAwsAuthentication();

  if (!authStatus.success) {
    const statusCode = authStatus.errorType === 'access-denied' ? 403 : 401;
    return {
      statusCode,
      body: {
        success: false,
        message: authStatus.message,
      },
    };
  }

  return {
    statusCode: 200,
    body: authStatus,
  };
}

async function listAvailableRegions() {
  try {
    const result = await runAwsCommand(describeRegionsCommand(), { timeout: 30000 });
    const parsed = safeJsonParse(result.stdout, {});
    const regions = toArray(parsed.Regions)
      .map((region) => ({
        name: region.RegionName || '',
        description: REGION_DESCRIPTIONS[region.RegionName] || region.RegionName || '',
      }))
      .filter((region) => region.name)
      .sort((left, right) => left.name.localeCompare(right.name));

    return regions;
  } catch (error) {
    const classified = classifyAwsError(error);
    const statusCodeMap = {
      'cli-not-installed': 503,
      'credentials-missing': 401,
      'session-expired': 401,
      'invalid-credentials': 401,
      'access-denied': 403,
      'timeout': 504,
      'invalid-region': 400,
      'unknown': 500,
    };

    const regionError = new Error(classified.message);
    regionError.statusCode = statusCodeMap[classified.type] || 500;
    regionError.errorType = classified.type;
    throw regionError;
  }
}

function parseEc2Instances(payload) {
  const parsed = safeJsonParse(payload, {});

  return toArray(parsed.Reservations)
    .flatMap((reservation) => toArray(reservation.Instances))
    .map((instance) => ({
      instanceId: instance.InstanceId || '',
      name: getTagValue(instance.Tags, 'Name'),
      instanceType: instance.InstanceType || '',
      state: instance.State?.Name || '',
      publicIp: instance.PublicIpAddress || '',
      privateIp: instance.PrivateIpAddress || '',
      availabilityZone: instance.Placement?.AvailabilityZone || '',
      launchTime: instance.LaunchTime || '',
      securityGroups: toArray(instance.SecurityGroups).map((group) => ({
        groupId: group.GroupId || '',
        groupName: group.GroupName || '',
      })),
    }));
}

function parseEbsVolumes(payload) {
  const parsed = safeJsonParse(payload, {});

  return toArray(parsed.Volumes).map((volume) => ({
    volumeId: volume.VolumeId || '',
    size: volume.Size || 0,
    type: volume.VolumeType || '',
    state: volume.State || '',
    attached: toArray(volume.Attachments).length > 0,
    availabilityZone: volume.AvailabilityZone || '',
    encrypted: Boolean(volume.Encrypted),
    attachments: toArray(volume.Attachments).map((attachment) => ({
      instanceId: attachment.InstanceId || '',
      device: attachment.Device || '',
      state: attachment.State || '',
    })),
  }));
}

function parseElasticIps(payload) {
  const parsed = safeJsonParse(payload, {});

  return toArray(parsed.Addresses).map((address) => ({
    publicIp: address.PublicIp || '',
    allocationId: address.AllocationId || '',
    associationId: address.AssociationId || '',
    instanceId: address.InstanceId || '',
    domain: address.Domain || '',
    networkInterfaceId: address.NetworkInterfaceId || '',
    privateIpAddress: address.PrivateIpAddress || '',
  }));
}

function parseLoadBalancers(payload) {
  const parsed = safeJsonParse(payload, {});

  return toArray(parsed.LoadBalancers).map((loadBalancer) => ({
    loadBalancerArn: loadBalancer.LoadBalancerArn || '',
    name: loadBalancer.LoadBalancerName || '',
    type: loadBalancer.Type || '',
    state: loadBalancer.State?.Code || '',
    scheme: loadBalancer.Scheme || '',
    dnsName: loadBalancer.DNSName || '',
    vpcId: loadBalancer.VpcId || '',
    availabilityZones: toArray(loadBalancer.AvailabilityZones).map((zone) => zone.ZoneName || zone.SubnetId || ''),
  }));
}

function parseRdsInstances(payload) {
  const parsed = safeJsonParse(payload, {});

  return toArray(parsed.DBInstances).map((dbInstance) => ({
    dbInstanceIdentifier: dbInstance.DBInstanceIdentifier || '',
    engine: dbInstance.Engine || '',
    engineVersion: dbInstance.EngineVersion || '',
    dbInstanceClass: dbInstance.DBInstanceClass || '',
    dbInstanceStatus: dbInstance.DBInstanceStatus || '',
    endpoint: dbInstance.Endpoint?.Address || '',
    port: dbInstance.Endpoint?.Port || 0,
    multiAz: Boolean(dbInstance.MultiAZ),
    allocatedStorage: dbInstance.AllocatedStorage || 0,
    publiclyAccessible: Boolean(dbInstance.PubliclyAccessible),
    storageEncrypted: Boolean(dbInstance.StorageEncrypted),
    vpcSecurityGroups: toArray(dbInstance.VpcSecurityGroups).map((group) => ({
      id: group.VpcSecurityGroupId || '',
      status: group.Status || '',
    })),
  }));
}

function parseLambdaFunctions(payload) {
  const parsed = safeJsonParse(payload, {});

  return toArray(parsed.Functions).map((lambdaFunction) => ({
    functionName: lambdaFunction.FunctionName || '',
    runtime: lambdaFunction.Runtime || '',
    memorySize: lambdaFunction.MemorySize || 0,
    timeout: lambdaFunction.Timeout || 0,
    lastModified: lambdaFunction.LastModified || '',
    handler: lambdaFunction.Handler || '',
    role: lambdaFunction.Role || '',
    architectures: toArray(lambdaFunction.Architectures),
    codeSize: lambdaFunction.CodeSize || 0,
  }));
}

function parseVpcs(payload) {
  const parsed = safeJsonParse(payload, {});

  return toArray(parsed.Vpcs).map((vpc) => ({
    vpcId: vpc.VpcId || '',
    cidrBlock: vpc.CidrBlock || '',
    isDefault: Boolean(vpc.IsDefault),
    state: vpc.State || '',
    instanceTenancy: vpc.InstanceTenancy || '',
    tags: normalizeTags(vpc.Tags),
  }));
}

function parseCloudWatchAlarms(payload) {
  const parsed = safeJsonParse(payload, {});

  return [
    ...toArray(parsed.MetricAlarms).map((alarm) => ({
      alarmName: alarm.AlarmName || '',
      alarmDescription: alarm.AlarmDescription || '',
      stateValue: alarm.StateValue || '',
      metricName: alarm.MetricName || '',
      namespace: alarm.Namespace || '',
      comparisonOperator: alarm.ComparisonOperator || '',
      threshold: alarm.Threshold ?? null,
      evaluationPeriods: alarm.EvaluationPeriods ?? null,
      actionsEnabled: Boolean(alarm.ActionsEnabled),
    })),
    ...toArray(parsed.CompositeAlarms).map((alarm) => ({
      alarmName: alarm.AlarmName || '',
      alarmDescription: alarm.AlarmRule || '',
      stateValue: alarm.StateValue || '',
      metricName: '',
      namespace: '',
      comparisonOperator: '',
      threshold: null,
      evaluationPeriods: null,
      actionsEnabled: Boolean(alarm.ActionsEnabled),
    })),
  ];
}

function parseS3Buckets(payload) {
  const parsed = safeJsonParse(payload, {});

  return toArray(parsed.Buckets).map((bucket) => ({
    name: bucket.Name || '',
    creationDate: bucket.CreationDate || '',
  }));
}

function parseIamRoles(payload) {
  const parsed = safeJsonParse(payload, {});

  return toArray(parsed.Roles).map((role) => ({
    roleName: role.RoleName || '',
    roleId: role.RoleId || '',
    arn: role.Arn || '',
    createDate: role.CreateDate || '',
    path: role.Path || '',
  }));
}

async function executeScanTask(task) {
  try {
    const result = await runAwsCommand(task.command, { timeout: task.timeout });
    return {
      key: task.key,
      data: task.parser(result.stdout || result.stderr || ''),
      warning: null,
    };
  } catch (error) {
    const classified = classifyAwsError(error);
    return {
      key: task.key,
      data: [],
      warning: classified.message,
      errorType: classified.type,
    };
  }
}

async function analyzeInfrastructure(region) {
  const cliStatus = await checkAwsCliInstalled();
  if (!cliStatus.installed) {
    return {
      statusCode: 503,
      body: {
        success: false,
        message: cliStatus.message,
      },
    };
  }

  const authStatus = await verifyAwsAuthentication();
  if (!authStatus.success) {
    const statusCode = authStatus.errorType === 'access-denied' ? 403 : 401;
    return {
      statusCode,
      body: {
        success: false,
        message: authStatus.message,
      },
    };
  }

  const tasks = [
    {
      key: 'ec2',
      command: describeInstancesCommand(region),
      parser: parseEc2Instances,
      timeout: 60000,
    },
    {
      key: 'ebs',
      command: describeVolumesCommand(region),
      parser: parseEbsVolumes,
      timeout: 60000,
    },
    {
      key: 'elasticIps',
      command: describeAddressesCommand(region),
      parser: parseElasticIps,
      timeout: 60000,
    },
    {
      key: 'loadBalancers',
      command: describeLoadBalancersCommand(region),
      parser: parseLoadBalancers,
      timeout: 60000,
    },
    {
      key: 'rds',
      command: describeDbInstancesCommand(region),
      parser: parseRdsInstances,
      timeout: 60000,
    },
    {
      key: 'lambda',
      command: listLambdaFunctionsCommand(region),
      parser: parseLambdaFunctions,
      timeout: 60000,
    },
    {
      key: 'vpcs',
      command: describeVpcsCommand(region),
      parser: parseVpcs,
      timeout: 60000,
    },
    {
      key: 'cloudwatch',
      command: describeAlarmsCommand(region),
      parser: parseCloudWatchAlarms,
      timeout: 60000,
    },
    {
      key: 's3',
      command: listBucketsCommand(),
      parser: parseS3Buckets,
      timeout: 60000,
    },
    {
      key: 'iam',
      command: listRolesCommand(),
      parser: parseIamRoles,
      timeout: 60000,
    },
  ];

  const results = await Promise.all(tasks.map((task) => executeScanTask(task)));
  const warnings = results.filter((result) => result.warning).map((result) => `${result.key}: ${result.warning}`);

  return {
    statusCode: 200,
    body: {
      success: true,
      region,
      warnings,
      resources: results.reduce(
        (accumulator, result) => ({
          ...accumulator,
          [result.key]: result.data,
        }),
        {
          ec2: [],
          ebs: [],
          elasticIps: [],
          loadBalancers: [],
          rds: [],
          lambda: [],
          vpcs: [],
          s3: [],
          iam: [],
          cloudwatch: [],
        }
      ),
    },
  };
}

module.exports = {
  getHealthStatus,
  listAvailableRegions,
  analyzeInfrastructure,
};