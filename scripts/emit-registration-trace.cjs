(async function(){
  process.env.NOTIFICATION_RUNTIME_TRACE = "true";
  process.env.NODE_ENV = process.env.NODE_ENV || "development";

  try {
    // Register ts-node and tsconfig-paths so TypeScript and path aliases resolve
    require('ts-node').register({ transpileOnly: true, project: './tsconfig.json' });
    const tsConfigPaths = require('tsconfig-paths');
    tsConfigPaths.register({
      baseUrl: process.cwd(),
      paths: { '@/*': ['./*'] }
    });

    const { registerUserAccount } = require('../lib/auth/user-profile.service.ts');

    console.log('Invoking registerUserAccount to emit domain event and capture runtime trace...');
    await registerUserAccount({ email: 'trace-user@example.com', name: 'Trace User' });
    console.log('Done. Check the console output above for the Notification Runtime trace.');
  } catch (err) {
    console.error('emit-registration-trace failed', err);
    process.exit(1);
  }
})();
