import { BaseService } from '../../_shared/base-services';
import { FileAssetModel, IFileAsset } from '../model';

export class FileAssetService extends BaseService<IFileAsset> {
  constructor() {
    super(FileAssetModel);
  }
}

export const fileAssetService = new FileAssetService();
