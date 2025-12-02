import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestApplicationOptions } from '@nestjs/common';
import * as fs from 'fs';
import { HttpsOptions } from '@nestjs/common/interfaces/external/https-options.interface';
import { resolve } from 'path';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCsrf from '@fastify/csrf-protection';
import fastifyHelmet from '@fastify/helmet';
import fastifyMultipart from '@fastify/multipart';

async function bootstrap() {
  const httpsMode = !!Number(process.env.HTTPS_MODE);
  const { httpsOptions }: NestApplicationOptions =
    generateHttpsModeOption(httpsMode);
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ https: httpsOptions! }),
  );

  await app.register(fastifyCsrf);
  await app.register(fastifyHelmet);
  await app.register(fastifyMultipart);

  app.enableCors();
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0', () => {
    console.log(
      `Application Started at port: ${process.env.PORT ?? 3000}, httpsMode: ${httpsMode}`,
    );
  });
}

function generateHttpsModeOption(httpsMode: boolean): NestApplicationOptions {
  if (httpsMode) {
    /**
     * Enter Your Https Certificate using below code
     *
     * @hint make sure you set 'HTTPS_MODE' field in env file to 1
     * @tips recommended for using absolute root path (/)
     * @optional __dirname + path/to/file
     */

    const privateKey = fs.readFileSync(
      resolve('/home/nodeapp/cert/private.key'),
      'utf-8',
    );

    const certificate = fs.readFileSync(
      resolve('/home/nodeapp/cert/fullchain.pem'),
      'utf-8',
    );

    const caBundle = fs.readFileSync(
      resolve('/home/nodeapp/cert/ca_bundle.crt'),
      'utf-8',
    );

    const credentials: HttpsOptions = {
      key: privateKey,
      cert: certificate,
      ca: caBundle,
      requestCert: false,
      rejectUnauthorized: false,
    };
    return { httpsOptions: credentials };
  }
  return {};
}
bootstrap();
