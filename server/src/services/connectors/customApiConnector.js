import { BaseConnector } from './baseConnector.js';
import { getOne } from '../../db/index.js';

export class CustomApiConnector extends BaseConnector {
  constructor() {
    super('External Commercial Provider', 'custom_api', true);
  }

  async getConfiguration() {
    const connector = await getOne(
      'SELECT sc.status, sc.auth_config_json, rs.is_active FROM source_connectors sc JOIN research_sources rs ON sc.source_id = rs.id WHERE rs.code = $1',
      ['custom_api']
    );

    if (!connector || connector.status === 'unconfigured' || !connector.auth_config_json) {
      return { isConfigured: false, message: 'Provider API key not configured. Add credentials in Settings > Data Sources.' };
    }

    try {
      const config = JSON.parse(connector.auth_config_json);
      return { isConfigured: true, config };
    } catch (e) {
      return { isConfigured: false, message: 'Corrupted credentials configuration.' };
    }
  }

  async search(params) {
    const configCheck = await this.getConfiguration();
    if (!configCheck.isConfigured) {
      console.info(`[Custom API Connector] Skipping search: ${configCheck.message}`);
      return [];
    }

    // In a configured environment, execute the authorized API request
    return [];
  }
}
