module.exports = function (express, https, DefaultMiddleware, PromiseMiddleware, Logger, Promise, ErrorMiddleware,
                          config, ControllerRegistration, WinstonRequestLoggingMiddleware, fs) {
  class BaseWebServer {

    constructor() {
      this.app = express();
      if (config.Https) {
        this.privateKey = fs.readFileSync(config.Https.PrivateKeyFilePath, 'utf8');
        this.certificate = fs.readFileSync(config.Https.CertificateFilePath, 'utf8');
        this.credentials = {
          key: this.privateKey,
          cert: this.certificate
        };
      }
    }

    getPort() {
      let port = config.Port;

      if (this.server) {
        port = this.server.address().port || port;
      }

      return port;
    }

    getHttpsPort() {
      let port = config.Https.Port;

      if (this.server) {
        port = this.httpsServer.address().port || port;
      }

      return port;
    }

    registerDefaultMiddleware() {
      this.logSectionHeader('Default Middleware Registration');
      DefaultMiddleware.configure(this.app);
    }

    registerLoggingMiddleware() {
      this.logSectionHeader('Logging Middleware Registration');
      WinstonRequestLoggingMiddleware.configure(this.app);
    }

    registerMiddleware() {
      this.registerLoggingMiddleware();
      this.registerStaticMiddleware();
      this.registerDefaultMiddleware();
      this.registerTemplatingEngine();
      PromiseMiddleware.configure(this.app);
      this.registerControllers();
    }

    registerStaticMiddleware() {}

    registerTemplatingEngine() {}

    registerControllers() {
      this.logSectionHeader('Controller Registration');
      ControllerRegistration.register(this.app);
    }

    registerErrorMiddleware() {
      this.logSectionHeader('Error Middleware Registration');
      ErrorMiddleware.configure(this.app);
    }

    setCluster(cluster) {
      this.cluster = cluster;
    }

    start() {
      this.registerMiddleware();
      this.registerErrorMiddleware();

      return this.startInternal();
    }

    startInternal() {
      // eslint-disable-next-line no-unused-vars
      return new Promise((resolve, reject) => {
        if (config.Https) {
          this.httpsServer = https.createServer(this.credentials, this.app).listen(config.Https.Port, () => {
            Logger.info(this.startedMessageHttps());
            resolve();
          });
        }
        this.server = this.app.listen(config.Port, () => {
          Logger.info(this.startedMessage());
          resolve();
        });

        return Promise.promisifyAll(this.server);
      });
    }

    stop() {
      return this.getCloseAsync().finally(() => {
        Logger.info('Express server stopped');
      });
    }

    getCloseAsync() {
      if (this.server && this.server.closeAsync) {
        return this.server.closeAsync();
      }

      return Promise.resolve();
    }

    startedMessageHttps() {
      if (this.cluster) {
        return `Worker ${this.cluster.worker.id} started on port ${this.getHttpsPort()}`;
      }

      return `https express server started on port ${this.getHttpsPort()}`;
    }

    startedMessage() {
      if (this.cluster) {
        return `Worker ${this.cluster.worker.id} started on port ${this.getPort()}`;
      }

      return `Express app started on port ${this.getPort()}`;
    }

    logSectionHeader(message) {
      Logger.log('========================');
      Logger.info(`= ${message}`);
      Logger.log('========================');
    }
  }

  return BaseWebServer;
};
