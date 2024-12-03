import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export async function GET(request) {
  try {

    // Path to the CSV file (adjust the path if necessary)
    const csvFilePath = path.join(process.cwd(), 'public', 'players.csv');

    // Read the CSV file
    const csvData = fs.readFileSync(csvFilePath, 'utf-8');

    // Parse the CSV data
    const records = parse(csvData, {
      columns: true, // Automatically generate headers
      skip_empty_lines: true, // Skip empty rows
      trim: true, // Trim whitespace from values
    });

    // Respond with the matching row
    return new Response(JSON.stringify(records), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
