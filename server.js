const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config(); //use .env

const connectMongoDB = require('./src/config/connectMongoDB.config');
const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const mainRoutes = require('./src/routes');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const { HOST, PORT_DB, DB } = require('./src/config/db.config');
const passport = require('passport');
const { configureGooglePassport, configureFacebookPassport } = require('./src/config/passport.config');
const PORT = process.env.PORT || 3000;
const app = express();
const http = require('http');
// const server = http.createServer(app);

const { corsOptions } = require('./src/config/cors.config');

app.use(cors(corsOptions));
app.options(/(.*)/, cors(corsOptions)); // handle preflight

//google login
configureGooglePassport();
configureFacebookPassport();
app.use(passport.initialize());

//user cookie-parser
app.use(cookieParser());

// Swagger config
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Rendezvous API',
    version: '1.0.0',
    description: 'Document API for project Rendezvous',
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  servers: [
    {
      url: 'https://rendezvous-svc.onrender.com',
      description: 'Deploy server',
    },
    {
      url: 'http://localhost:3000',
      description: 'Local development server',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.route.js'],
};

const swaggerSpec = swaggerJSDoc(options);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(morgan('combined'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.use((req, res, next) => {
//   res.io = io;
//   next();
// })

// Routes
app.use('/', mainRoutes);
// app.use(errorHandler);

connectMongoDB().then(() => {
  const server = http.createServer(app);
  server.listen(PORT, '0.0.0.0', () =>
    console.log(`Server running on http://${HOST}:${PORT}`)
  );
  const { initSocket } = require('./src/config/socket.config');
  initSocket(server);
  console.log('[Main] Socket.IO initialized');

  require('./src/cron/postCleanup.cron');
});
