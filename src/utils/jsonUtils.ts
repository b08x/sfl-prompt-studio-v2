
export const parseJsonFromText = (text: string) => {
  let jsonStr = text.trim();
  
  // Find the first '{' or '[' and the last '}' or ']'
  // to trim off any leading/trailing text from the model.
  const firstBracket = jsonStr.indexOf('[');
  const firstBrace = jsonStr.indexOf('{');
  
  let startIndex = -1;

  // Determine if array or object appears first
  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    startIndex = firstBracket;
  } else if (firstBrace !== -1) {
    startIndex = firstBrace;
  }
  
  if (startIndex > -1) {
      const lastBracket = jsonStr.lastIndexOf(']');
      const lastBrace = jsonStr.lastIndexOf('}');
      
      // Match the closing bracket type to the opening one
      const endIndex = jsonStr[startIndex] === '[' ? lastBracket : lastBrace;
      
      if (endIndex > startIndex) {
          jsonStr = jsonStr.substring(startIndex, endIndex + 1);
      }
  }
  
  // Attempt to fix common invalid JSON from LLMs. This is a defensive measure.
  jsonStr = jsonStr.replace(/\\\\n/g, '\\n'); // Fix over-escaped newlines
  jsonStr = jsonStr.replace(/\\\\"/g, '\\"'); // Fix over-escaped quotes
  jsonStr = jsonStr.replace(/:(\s*)undefined\b/g, ':$1null'); // Replace ": undefined" with ": null"
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1'); // Remove trailing commas from objects and arrays

  try {
    const data = JSON.parse(jsonStr);
    // Normalize data: remove null sourceDocument if present
    if (data && typeof data === 'object' && data.sourceDocument === null) {
      delete data.sourceDocument;
    }
    return data;
  } catch (e) {
    console.error("Failed to parse JSON response:", e, "Raw text:", text);
    throw new Error("The AI returned a response that was not valid JSON.");
  }
};
