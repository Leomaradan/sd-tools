import { table } from 'table';

import { getFiles } from '../commons/file';

export const getStats = (source: string) => {
  const files = getFiles(source, true, true);

  const stats: Record<string, Record<string, number>> = {};

  files.forEach((file) => {
    if (file.filename.endsWith('.png')) {
      const date = new Date(file.date);
      const dateStr = `${date.getFullYear()}-${date.getMonth()}`;
      const { data } = file;
      if (data) {
        data.forEach((line) => {
          if (line.includes('Model: ')) {
            const model = line.split('Model: ')[1].split(', ')[0];
            if (stats[model] === undefined) {
              stats[model] = {};
            }

            stats[model].total = (stats[model].total ?? 0) + 1;

            stats[model][dateStr] = (stats[model][dateStr] ?? 0) + 1;
          }
        });
      }
    }
  });

  const dataTable: Array<number | string>[] = [['Model']];

  const columnMapping: Record<string, number> = {};
  Object.keys(stats).forEach((model, index) => {
    if (index === 0) {
      Object.keys(stats[model])
        .sort((a, b) => a.localeCompare(b))
        .forEach((date, index) => {
          columnMapping[date] = index + 1;
          dataTable[0].push(date);
        });
    }

    const row: Array<number | string> = [model];
    Object.keys(stats[model]).forEach((date) => {
      const mappedIndex = columnMapping[date];
      row[mappedIndex] = stats[model][date];
    });

    dataTable.push(row);
  });

  // eslint-disable-next-line no-console
  console.log(table(dataTable));
};
