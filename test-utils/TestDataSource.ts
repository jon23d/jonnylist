import { LocalDataSource } from '@/data/LocalDataSource';

class TestDataSource extends LocalDataSource {
  async destroy() {
    await this.db.destroy();
  }
}
