const jwt = require('jsonwebtoken');

// Parse command line arguments
const args = process.argv.slice(2);
let user,
  databaseName,
  base64Secret,
  verbose = false;

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '-u':
      user = args[i + 1];
      i++; // Skip next argument since it's the value
      break;
    case '-d':
      databaseName = args[i + 1];
      i++;
      break;
    case '-s':
      base64Secret = args[i + 1];
      i++;
      break;
    case '-v':
      verbose = true;
      break;
    default:
      if (args[i].startsWith('-')) {
        console.error(`Unknown flag: ${args[i]}`);
        process.exit(1);
      }
  }
}

// Validation
if (!user) {
  console.error('Error: User is required. Use -u <username>');
  process.exit(1);
}

if (!databaseName) {
  console.error('Error: Database name is required. Use -d <database_name>');
  process.exit(1);
}

if (!base64Secret) {
  console.error('Error: Secret is required. Use -s <base64_secret>');
  process.exit(1);
}

const secret = Buffer.from(base64Secret, 'base64');

const payload = {
  sub: user,
  exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365, // 1 year
  db: databaseName,
};
const token = jwt.sign(payload, secret, { algorithm: 'HS256' });

if (verbose) {
  console.log('Created jwt for user:', user);
  console.log('Database:', databaseName);
  console.log('Used secret:', base64Secret);
  console.log('Generated JWT:', token);
} else {
  console.log(token);
}
