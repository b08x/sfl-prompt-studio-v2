
export const parseJsonFromText = (text: string) => {
  let jsonStr = text.trim();
  
  // This regex finds the first JSON code block anywhere in the text.
  const fenceMatch = jsonStr.match(/```(?:\w+)?\s*([\s\S]*?)\s*```/s);

  if (fenceMatch && fenceMatch[1]) {
    jsonStr = fenceMatch[1].trim();
  } else {
    // If no fences, find the first '{' or '[' and the last '}' or ']'
    const firstBracket = jsonStr.indexOf('[');
    const firstBrace = jsonStr.indexOf('{');
    
    let startIndex = -1;

    if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
      startIndex = firstBracket;
    } else if (firstBrace !== -1) {
      startIndex = firstBrace;
    }
    
    if (startIndex > -1) {
        const lastBracket = jsonStr.lastIndexOf(']');
        const lastBrace = jsonStr.lastIndexOf('}');
        const endIndex = jsonStr[startIndex] === '[' ? lastBracket : lastBrace;
        
        if (endIndex > startIndex) {
            jsonStr = jsonStr.substring(startIndex, endIndex + 1);
        } else {
            jsonStr = jsonStr.substring(startIndex);
        }
    }
  }
  
  jsonStr = jsonStr.replace(/\\\\n/g, '\\n');
  jsonStr = jsonStr.replace(/\\\\"/g, '\\"');
  jsonStr = jsonStr.replace(/:(\s*)undefined\b/g, ':$1null');
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');

  try {
    const data = JSON.parse(jsonStr);
    if (data.sourceDocument === null) {
      delete data.sourceDocument;
    }
    return data;
  } catch (e) {
    console.error("Failed to parse JSON response:", e, "Raw text:", text);
    throw new Error("The AI returned a response that was not valid JSON.");
  }
};
