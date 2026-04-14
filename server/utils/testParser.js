const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const csv = require('csv-parser');

// Parse PDF or DOCX file to text
const extractText = async (filePath, mimetype) => {
  if (mimetype === 'application/pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
  
  // Assume generic text if unknown
  return fs.readFileSync(filePath, 'utf8');
};

// Parse strict QA text format
const parseStrictTextQuestions = (text) => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const questions = [];
  let currentQuestion = null;

  for (let line of lines) {
    // Match Q1:, Q2:, or 1., 2. etc.
    const qMatch = line.match(/^(?:Q)?\d+[\.:]\s*(.+)/i);
    if (qMatch) {
      if (currentQuestion) {
        questions.push(currentQuestion);
      }
      currentQuestion = {
        questionText: qMatch[1],
        options: []
      };
      continue;
    }

    // Match A), b), C., D., or checkbox ☐, -, o etc.
    const optMatch = line.match(/^(?:[A-Ea-e][\.\)]|☐|-|o)\s*(.+)/);
    if (optMatch && currentQuestion) {
      currentQuestion.options.push(optMatch[1].trim());
    }
  }

  if (currentQuestion) {
    questions.push(currentQuestion);
  }

  return questions;
};

const parseStrictTextResults = (text) => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let startIndex = 0;
  const answerKeyIndex = lines.findIndex(l => l.toLowerCase().includes('answer key'));
  if (answerKeyIndex !== -1) {
    startIndex = answerKeyIndex + 1;
  }

  const results = [];
  for (let i = startIndex; i < lines.length; i++) {
    let line = lines[i];
    // Match 1. A, 2: B, or 1. Keyboard
    const rMatch = line.match(/^\d+[\.:]\s*(.+)/);
    if (rMatch) {
      results.push(rMatch[1].trim());
    }
  }

  return results;
};

// Handle CSV Parsing 
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
};

const parseTestUploads = async (testFile, resultFile) => {
  let finalQuestions = [];

  // Parse questions
  if (testFile.mimetype === 'text/csv') {
    const csvData = await parseCSV(testFile.path);
    // CSV format: Question, OptionA, OptionB, OptionC, OptionD, Answer (optional, override by resultFile)
    for (const row of csvData) {
      const q = {
        questionText: row.Question || row.question || row.QUESTION,
        options: [
          row.OptionA || row.optionA || row.A || '',
          row.OptionB || row.optionB || row.B || '',
          row.OptionC || row.optionC || row.C || '',
          row.OptionD || row.optionD || row.D || ''
        ].filter(o => o.trim() !== '')
      };
      if(row.Answer || row.answer) {
         q.correctAnswer = row.Answer || row.answer;
      }
      finalQuestions.push(q);
    }
  } else {
    // PDF or DOCX
    const text = await extractText(testFile.path, testFile.mimetype);
    finalQuestions = parseStrictTextQuestions(text);
  }

  // Parse results if provided
  if (resultFile) {
    if (resultFile.mimetype === 'text/csv') {
      const csvData = await parseCSV(resultFile.path);
      // CSV format: QNumber, Answer
      csvData.forEach((row, index) => {
        let answer = row.Answer || row.answer;
        if(answer && finalQuestions[index]) {
          // Map "A,B,C,D" to actual option string
          const optMap = {'A': 0, 'B': 1, 'C': 2, 'D': 3};
          const letter = answer.trim().toUpperCase()[0];
          if(optMap[letter] !== undefined && finalQuestions[index].options[optMap[letter]]) {
             finalQuestions[index].correctAnswer = finalQuestions[index].options[optMap[letter]];
          } else {
            finalQuestions[index].correctAnswer = answer;
          }
        }
      });
    } else {
      const text = await extractText(resultFile.path, resultFile.mimetype);
      const resultsTextArray = parseStrictTextResults(text);
      resultsTextArray.forEach((ansStr, index) => {
        if(finalQuestions[index]) {
           const optMap = {'A': 0, 'B': 1, 'C': 2, 'D': 3};
           const normalizedStr = ansStr.trim().toUpperCase();
           if(normalizedStr.length === 1 && optMap[normalizedStr] !== undefined && finalQuestions[index].options[optMap[normalizedStr]]) {
             finalQuestions[index].correctAnswer = finalQuestions[index].options[optMap[normalizedStr]];
           } else {
             // Fallback exact match
             const matchedOpt = finalQuestions[index].options.find(o => o.toLowerCase() === ansStr.toLowerCase());
             if (matchedOpt) {
                finalQuestions[index].correctAnswer = matchedOpt;
             } else {
                finalQuestions[index].correctAnswer = ansStr;
             }
           }
        }
      });
    }
  }

  // Clean up incomplete questions
  return finalQuestions.filter(q => q.questionText && q.options.length > 0 && q.correctAnswer);
};

module.exports = { parseTestUploads };
