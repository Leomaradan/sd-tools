import fs from 'fs';
import path from 'path';

export const logger = (message: string) => {
  // eslint-disable-next-line no-console
  console.log(message);
};

export const writeLog = (...data: any[]) => {
  const logPath = path.resolve(__dirname, '..', 'logs');
  const logFile = path.resolve(logPath, `log-${new Date().toISOString().substring(0, 10)}.txt`);
  if (!fs.existsSync(logPath)) {
    fs.mkdirSync(logPath);
  }

  if (!fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, '');
  }

  fs.appendFileSync(
    logFile,
    `${JSON.stringify(data, (key, value) => {
      if (['input_image'].includes(key)) {
        return (value as string).substring(0, 100);
      }

      if (['init_images'].includes(key)) {
        return (value as string[]).map((item) => item.substring(0, 100));
      }

      return value;
    })}\n`
  );
};
