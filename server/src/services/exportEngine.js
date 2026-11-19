export class ExportEngine {
  convertToCSV(rows, columns) {
    if (!rows || rows.length === 0) {
      return columns.map(c => `"${c.label}"`).join(',') + '\n';
    }

    const header = columns.map(c => `"${c.label}"`).join(',');
    const body = rows.map(row => {
      return columns.map(col => {
        let val = row[col.key];
        if (val === null || val === undefined) {
          val = '';
        } else if (typeof val === 'object') {
          val = JSON.stringify(val);
        } else {
          val = String(val).replace(/"/g, '""'); // Escape double quotes
        }
        return `"${val}"`;
      }).join(',');
    }).join('\n');

    return `${header}\n${body}\n`;
  }

  exportCompaniesCSV(companies) {
    const columns = [
      { key: 'legal_name', label: 'Company Legal Name' },
      { key: 'primary_country', label: 'Country' },
      { key: 'primary_city', label: 'City' },
      { key: 'primary_industry', label: 'Industry' },
      { key: 'business_type', label: 'Business Type' },
      { key: 'nkb_service_fit', label: 'NKB Manufacturing Synergy' },
      { key: 'official_website', label: 'Official Website' },
      { key: 'total_score', label: 'Lead Score (100)' },
      { key: 'priority_tier', label: 'Priority Tier' },
      { key: 'confidence_level', label: 'Confidence' },
      { key: 'verification_status', label: 'Verification Status' },
      { key: 'source_attribution', label: 'Source Reference' },
      { key: 'first_discovered_at', label: 'Discovered Date' }
    ];
    return this.convertToCSV(companies, columns);
  }

  exportOpportunitiesCSV(opportunities) {
    const columns = [
      { key: 'title', label: 'Opportunity Title' },
      { key: 'company_name', label: 'Target Company' },
      { key: 'pipeline_stage', label: 'Pipeline Stage' },
      { key: 'service_category', label: 'Service Category' },
      { key: 'estimated_value', label: 'Estimated Value' },
      { key: 'win_probability', label: 'Win Probability (%)' },
      { key: 'assigned_name', label: 'Assigned Lead Owner' },
      { key: 'created_at', label: 'Created Date' }
    ];
    return this.convertToCSV(opportunities, columns);
  }
}

export const exportEngine = new ExportEngine();
