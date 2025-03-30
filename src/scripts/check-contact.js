// Script to check contact details from Supabase
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://ycwttshvizkotcwwyjpt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inljd3R0c2h2aXprb3Rjd3d5anB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODI0NDk3NSwiZXhwIjoyMDUzODIwOTc1fQ.blOq_yJX-J-N7znR-4220THNruoI7j_bLONliOtukmQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function getContactDetails() {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', '7e12e17c-0e78-4ca9-8f2c-fc248f1aa60b')
      .single();
    
    if (error) {
      console.error('Error fetching contact:', error);
      return;
    }
    
    console.log('Contact details:');
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\nTags (raw):');
    console.log(data.tags);
    
    if (typeof data.tags === 'string') {
      try {
        const parsedTags = JSON.parse(data.tags);
        console.log('\nTags (parsed):');
        console.log(parsedTags);
      } catch (e) {
        console.error('Error parsing tags:', e);
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

getContactDetails();
