import { writeBackupFile } from './backup';
import { buildExport } from './storage';

/** Обновляет автокопию в файл, если пользователь её настроил. Без выбранного файла ничего не делает. */
export const autoBackup = (interactive = true) => writeBackupFile(JSON.stringify(buildExport(), null, 2), interactive);
