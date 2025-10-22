require("dotenv").config();
const express = require("express");
const ValueModel = require("./models/string");
const app = express();
const crypto = require("crypto");

app.use(express.json());

const PORT = process.env.PORT;

const mongoose = require("mongoose");

mongoose
  .connect(process.env.DB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  return res.json({
    hello: "World",
  });
});
function hashString(stringRecieved) {
  const hash = crypto.createHash("sha256").update(stringRecieved).digest("hex");
  return hash;
}
function checkIsPalindrome(stringRecieved) {
  let result = "";
  for (let i = stringRecieved.length - 1; i >= 0; i--) {
    result += stringRecieved[i];
  }

  if (result.toLowerCase() === stringRecieved.toLowerCase()) {
    return true;
  }

  return false;
}

function getCharactersMap(stringRecieved) {
  const obj = {};

  for (let i = 0; i < stringRecieved.length; i++) {
    let currentVal = stringRecieved[i];
    obj[currentVal] ? obj[currentVal]++ : (obj[currentVal] = 1);
  }

  return obj;
}

function getUniqueCharacters(stringRecieved) {
  const characterMap = getCharactersMap(stringRecieved);
  let count = 0;
  for (let key in characterMap) {
    count++;
  }
  return count;
}
function extractWordCount(stringRecieved) {
  return stringRecieved.split(" ").length;
}
app.post("/strings", async (req, res) => {
  try {
    const data = req.body;
    const stringRecieved = data.value;

    if (!stringRecieved) {
      return res
        .status(400)
        .json({ error: 'Invalid request body or missing "value" field' });
    }

    if (typeof stringRecieved !== "string") {
      return res
        .status(422)
        .json({ error: 'Invalid data type for "value" (must be string)' });
    }

    const checkStringInDB = await ValueModel.findOne()
      .where("value")
      .equals(stringRecieved);

    console.log(checkStringInDB);

    if (checkStringInDB) {
      return res
        .status(409)
        .json({ error: "String already exists in the system" });
    }

    const newValue = new ValueModel({
      id: hashString(stringRecieved),
      value: stringRecieved,
      properties: {
        length: stringRecieved.length,
        is_palindrome: checkIsPalindrome(stringRecieved),
        unique_characters: getUniqueCharacters(stringRecieved),
        word_count: extractWordCount(stringRecieved),
        sha256_hash: hashString(stringRecieved),
        character_frequency_map: getCharactersMap(stringRecieved),
      },
      created_at: new Date().toISOString(),
    });

    await newValue.save();

    return res.status(201).json({
      id: newValue.id,
      value: newValue.value,
      properties: {
        length: newValue.properties.length,
        is_palindrome: newValue.properties.is_palindrome,
        unique_characters: newValue.properties.unique_characters,
        word_count: newValue.properties.word_count,
        sha256_hash: newValue.properties.sha256_hash,
        character_frequency_map: newValue.properties.character_frequency_map,
      },
      created_at: newValue.created_at,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/strings", async (req, res) => {
  try {
    const query = req.query;
    const {
      is_palindrome,
      min_length,
      max_length,
      word_count,
      contains_character,
    } = query;

    const filter = {};
    const filters_applied = {};

    if (is_palindrome !== undefined) {
      if (is_palindrome !== "true" && is_palindrome !== "false") {
        return res.status(400).json({
          error: "Invalid query parameter values or types",
        });
      }
      filter["properties.is_palindrome"] = is_palindrome === "true";
      filters_applied.is_palindrome = is_palindrome === "true";
    }
    if (min_length) {
      if (isNaN(parseInt(min_length))) {
        return res
          .status(400)
          .json({ error: "Invalid query parameter values or types" });
      }
      filter["properties.length"] = filter["properties.length"] || {};
      filter["properties.length"].$gte = parseInt(min_length);
      filters_applied.min_length = parseInt(min_length);
    }
    if (max_length) {
      if (isNaN(parseInt(max_length))) {
        return res
          .status(400)
          .json({ error: "Invalid query parameter values or types" });
      }
      filter["properties.length"] = filter["properties.length"] || {};
      filter["properties.length"].$lte = parseInt(max_length);
      filters_applied.max_length = parseInt(max_length);
    }
    if (word_count) {
      if (isNaN(parseInt(word_count))) {
        return res
          .status(400)
          .json({ error: "Invalid query parameter values or types" });
      }
      filter["properties.word_count"] = parseInt(word_count);
      filters_applied.word_count = parseInt(word_count);
    }
    if (contains_character) {
      if (contains_character.trim().length !== 1) {
        return res.status(400).json({
          error: "Invalid query parameter values or types",
        });
      }
      filter[`properties.character_frequency_map.${contains_character}`] = {
        $exists: true,
      };
      filters_applied.contains_character = contains_character;
    }

    const strings = await ValueModel.find(filter).lean();
    return res.json({
      data: strings,
      count: strings.length,
      filters_applied
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Helper function to parse natural language queries
function parseNaturalLanguageQuery(query) {
  const lowerQuery = query.toLowerCase().trim();
  const filters = {};

  // Check for palindrome
  if (lowerQuery.includes("palindrome") || lowerQuery.includes("palindromic")) {
    filters.is_palindrome = true;
  }

  // Check for word count patterns
  if (lowerQuery.includes("single word") || lowerQuery.includes("one word")) {
    filters.word_count = 1;
  } else if (lowerQuery.includes("two word")) {
    filters.word_count = 2;
  } else if (lowerQuery.includes("three word")) {
    filters.word_count = 3;
  } else if (lowerQuery.includes("four word")) {
    filters.word_count = 4;
  } else if (lowerQuery.includes("five word")) {
    filters.word_count = 5;
  }

  // Check for length filters
  const longerThanMatch = lowerQuery.match(/longer than (\d+)/);
  const moreThanMatch = lowerQuery.match(/more than (\d+) character/);
  const atLeastMatch = lowerQuery.match(/at least (\d+) character/);
  
  if (longerThanMatch) {
    filters.min_length = parseInt(longerThanMatch[1]) + 1;
  } else if (moreThanMatch) {
    filters.min_length = parseInt(moreThanMatch[1]) + 1;
  } else if (atLeastMatch) {
    filters.min_length = parseInt(atLeastMatch[1]);
  }

  const shorterThanMatch = lowerQuery.match(/shorter than (\d+)/);
  const lessThanMatch = lowerQuery.match(/less than (\d+) character/);
  const atMostMatch = lowerQuery.match(/at most (\d+) character/);
  
  if (shorterThanMatch) {
    filters.max_length = parseInt(shorterThanMatch[1]) - 1;
  } else if (lessThanMatch) {
    filters.max_length = parseInt(lessThanMatch[1]) - 1;
  } else if (atMostMatch) {
    filters.max_length = parseInt(atMostMatch[1]);
  }

  // Check for character containment
  const letterMatch = lowerQuery.match(/letter ([a-z])/);
  const characterMatch = lowerQuery.match(/character ([a-z])/);
  const containsMatch = lowerQuery.match(/contains ([a-z])\b/);
  
  if (letterMatch) {
    filters.contains_character = letterMatch[1];
  } else if (characterMatch) {
    filters.contains_character = characterMatch[1];
  } else if (containsMatch) {
    filters.contains_character = containsMatch[1];
  }

  // Handle vowel references
  if (lowerQuery.includes("first vowel")) {
    filters.contains_character = "a";
  } else if (lowerQuery.includes("second vowel")) {
    filters.contains_character = "e";
  } else if (lowerQuery.includes("third vowel")) {
    filters.contains_character = "i";
  } else if (lowerQuery.includes("fourth vowel")) {
    filters.contains_character = "o";
  } else if (lowerQuery.includes("last vowel") || lowerQuery.includes("fifth vowel")) {
    filters.contains_character = "u";
  }

  return Object.keys(filters).length > 0 ? filters : null;
}

// Helper function to check for conflicting filters
function hasConflicts(filters) {
  // Check if min_length > max_length
  if (filters.min_length && filters.max_length) {
    if (filters.min_length > filters.max_length) {
      return true;
    }
  }
  return false;
}

// Helper function to build MongoDB filter from parsed filters
function buildMongoFilterFromNL(parsedFilters) {
  const filter = {};

  if (parsedFilters.is_palindrome !== undefined) {
    filter["properties.is_palindrome"] = parsedFilters.is_palindrome;
  }

  if (parsedFilters.min_length) {
    filter["properties.length"] = filter["properties.length"] || {};
    filter["properties.length"].$gte = parsedFilters.min_length;
  }

  if (parsedFilters.max_length) {
    filter["properties.length"] = filter["properties.length"] || {};
    filter["properties.length"].$lte = parsedFilters.max_length;
  }

  if (parsedFilters.word_count) {
    filter["properties.word_count"] = parsedFilters.word_count;
  }

  if (parsedFilters.contains_character) {
    filter[`properties.character_frequency_map.${parsedFilters.contains_character}`] = {
      $exists: true,
    };
  }

  return filter;
}

// Natural Language Filtering endpoint with AI
app.get("/strings/filter-by-natural-language", async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({
        error: "Unable to parse natural language query",
      });
    }

    console.log("Received NL query:", query);

    // Parse the natural language query
    const parsedFilters = parseNaturalLanguageQuery(query);

    if (!parsedFilters) {
      return res.status(400).json({
        error: "Unable to parse natural language query",
      });
    }

    // Check for conflicting filters
    if (hasConflicts(parsedFilters)) {
      return res.status(422).json({
        error: "Query parsed but resulted in conflicting filters",
      });
    }

    // Build MongoDB filter
    const mongoFilter = buildMongoFilterFromNL(parsedFilters);

    // Query the database
    const strings = await ValueModel.find(mongoFilter).lean();

    return res.json({
      data: strings,
      count: strings.length,
      interpreted_query: {
        original: query,
        parsed_filters: parsedFilters,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});



app.get("/strings/:string_value", async (req, res) => {
  try {
    const { string_value } = req.params;

    const requestedString = await ValueModel.findOne({
      value: string_value,
    }).lean();

    if (!requestedString) {
      return res
        .status(404)
        .json({ error: "String does not exist in the system" });
    }
    return res.json({
      id: requestedString.id,
      value: requestedString.value,
      properties: {
        length: requestedString.properties.length,
        is_palindrome: requestedString.properties.is_palindrome,
        unique_characters: requestedString.properties.unique_characters,
        word_count: requestedString.properties.word_count,
        sha256_hash: requestedString.properties.sha256_hash,
        character_frequency_map:
          requestedString.properties.character_frequency_map,
      },
      created_at: requestedString.created_at,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
app.delete("/strings/:string_value", async (req, res) => {
  try {
    const { string_value } = req.params;

    const requestedString = await ValueModel.findOne({
      value: string_value,
    }).lean();

    if (!requestedString) {
      return res
        .status(404)
        .json({ error: "String does not exist in the system" });
    }

    await ValueModel.deleteOne({
      value: string_value,
    });

    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


app.listen(3000, () => {
  console.log(process.env.PORT);
  console.log(`Server running on PORT ${PORT}`);
});
