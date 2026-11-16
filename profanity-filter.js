(function (root) {
  "use strict";

  const FILTER_VERSION = 1;
  const MAX_WINDOW = 16;
  const MAX_VARIANTS = 128;

  // Digits and symbols that are commonly used to disguise profanity.
  const LEET_OPTIONS = {
    "0": ["o", "u"],
    "1": ["i", "l"],
    "2": ["z"],
    "3": ["e"],
    "4": ["a"],
    "5": ["s"],
    "6": ["g"],
    "7": ["t"],
    "8": ["b"],
    "9": ["g"],
    "@": ["a"],
    "$": ["s"],
    "!": ["i", "l"],
    "|": ["i", "l"],
    "+": ["t"],
    "*": [""],
    "€": ["e"],
    "£": ["l"],
    "#": ["h"],
    "%": [""],
    "^": [""],
    "~": [""],
    "`": [""],
  };

  // Common lookalike characters from other alphabets.
  const HOMOGLYPHS = {
    "а": "a", "в": "b", "е": "e", "ё": "e", "к": "k", "м": "m",
    "н": "h", "о": "o", "р": "p", "с": "s", "т": "t", "у": "y",
    "х": "x", "і": "i", "ї": "i", "ј": "j", "ѕ": "s", "ԁ": "d",
    "ɡ": "g", "ⅰ": "i", "ⅼ": "l", "ο": "o", "α": "a", "ε": "e",
    "ι": "i", "κ": "k", "ν": "v", "ρ": "p", "τ": "t", "υ": "u",
    "χ": "x", "ω": "w", "ѵ": "v", "ӏ": "l",
  };

  const PROFANITY_TERMS = [
    // English
    "fuck", "fucks", "fucked", "fucker", "fuckers", "fucking", "fuckin",
    "fuckface", "fuckhead", "fucktard", "fucktards", "motherfucker",
    "motherfuckers", "motherfucking", "clusterfuck", "fuckyou", "fuckoff",
    "fuckup", "fuckwit",
    "shit", "shits", "shitty", "shitting", "shithead", "shitheads",
    "shitface", "bullshit", "horseshit", "dipshit", "apeshit", "shitshow",
    "bitch", "bitches", "bitchy", "bitchass", "sonofabitch",
    "bastard", "bastards",
    "ass", "asses", "asshole", "assholes", "arse", "arsehole", "arseholes",
    "dumbass", "dumbasses", "jackass", "jackasses",
    "dick", "dicks", "dickhead", "dickheads", "dickface",
    "cock", "cocks", "cocksucker", "cocksuckers",
    "pussy", "pussies", "cunt", "cunts",
    "whore", "whores", "whoring", "slut", "sluts", "slutty",
    "fag", "fags", "faggot", "faggots", "fagot", "fagots",
    "nigger", "niggers", "nigga", "niggas",
    "retard", "retards", "retarded",
    "wank", "wanker", "wankers", "wanking",
    "twat", "twats", "prick", "pricks",
    "douche", "douches", "douchebag", "douchebags",
    "piss", "pissed", "pissing",
    "idiot", "idiots", "idiotic", "stupid", "stupidity", "moron", "morons",
    "moronic", "imbecile", "damn", "dammit", "damned", "damning", "goddamn",
    "goddammit", "shite", "shites", "bollocks", "bollox", "bugger", "buggery",
    "crap", "crappy", "asshat", "asshats", "asswipe", "asswipes", "cunting",
    "bitchface",

    // Tagalog / Filipino
    "puta", "putang", "putangina", "putanginamo", "putanginang",
    "putanginanyo", "putanginyo", "putaena", "putaenamo", "putsa", "putsang",
    "pucha", "puchang", "puchangina",
    "tangina", "tanginamo", "tanginang", "tanginanyo", "tanginyo",
    "tangna", "taena", "taenamo", "kingina", "kinginamo", "kinginang",
    "gago", "gaga", "gagong", "gagung", "gagu", "gaguhan", "gagoka",
    "bobo", "boba", "bobong", "boboka",
    "tanga", "tangang", "tangahan", "tangamo",
    "ulol", "ulul", "ulolka",
    "lintik", "lintikan", "lintik ka",
    "hayop", "hayup", "hayop ka",
    "punyeta", "punyetas", "punyetang", "ponyeta", "ponyetang",
    "tarantado", "tarantada", "tarantadong",
    "kupal", "kupals", "kopal", "kupal ka",
    "pakyu", "pakyo", "pakyu ka", "pakyo ka",
    "bwisit", "bwisitan", "buwisit", "buwisitan", "bwisit ka",
    "leche", "letse", "leches", "letseng",
    "hindot", "hindutan", "hindot ka",
    "kantot", "kantutan", "kantotan", "kantutin", "kinantot",
    "kumakantot", "nakantot", "kantotero", "kantotera",
    "jakol", "jakolan", "nagjakol", "jakolero",
    "bayag", "bayagan",
    "burat", "buratan", "tite", "puki", "bilat", "oten", "tarugo", "tarugong",
    "titi", "titing", "titis",
    "pekpek", "pekpekan",
    "puke", "pukeng", "puking",
    "suso", "dede", "dedeng",
    "tae", "taeng", "taena", "tae ka",
    "pokpok", "pokpoks",
    "inutil", "inutil ka",
    "gunggong", "gunggong ka",
    "hangal", "hangal ka",
    "mokong", "mokong ka",
    "siraulo", "sira ulo",
    "abnoy",
    "pakshet", "paksyet", "pakingshet", "pakingsyet",
    "shet", "syet",
  ];

  const TERM_SET = new Set();
  const COLLAPSED_TERM_SET = new Set();
  const SKELETON_TERMS = new Map();

  function onlyLetters(value) {
    return String(value || "").toLowerCase().replace(/[^a-z]/g, "");
  }

  function collapseRepeats(value) {
    return String(value || "").replace(/(.)\1+/g, "$1");
  }

  function collapseLongRuns(value) {
    return String(value || "").replace(/(.)\1{2,}/g, "$1");
  }

  function skeleton(value) {
    return collapseLongRuns(String(value || "").replace(/[aeiou]/g, ""));
  }

  PROFANITY_TERMS.forEach((term) => {
    const normalized = onlyLetters(term);
    if (!normalized) return;

    TERM_SET.add(normalized);

    // Only use collapsed forms for terms without their own doubled letters.
    // This catches "fuuuck" without turning "assess" into "asses".
    if (normalized.length >= 4 && !/(.)\1/.test(normalized)) {
      COLLAPSED_TERM_SET.add(collapseRepeats(normalized));
    }

    const termSkeleton = skeleton(normalized);
    if (termSkeleton.length >= 2) {
      if (!SKELETON_TERMS.has(termSkeleton)) SKELETON_TERMS.set(termSkeleton, []);
      SKELETON_TERMS.get(termSkeleton).push(normalized);
    }
  });

  function prepareText(value) {
    let text = String(value || "");
    if (typeof text.normalize === "function") {
      text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }
    return text
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .toLowerCase()
      .replace(/[^\x00-\x7F]/g, (character) => HOMOGLYPHS[character] || character);
  }

  function findTerm(normalized, allowSkeleton) {
    if (!normalized) return null;
    if (TERM_SET.has(normalized)) return normalized;

    if (normalized.length >= 4) {
      const collapsed = collapseRepeats(normalized);
      if (collapsed.length >= 4 && COLLAPSED_TERM_SET.has(collapsed)) return collapsed;
    }

    if (allowSkeleton) {
      const candidateSkeleton = skeleton(normalized);
      const matches = SKELETON_TERMS.get(candidateSkeleton);
      if (matches) {
        const first = normalized[0];
        const last = normalized[normalized.length - 1];
        const match = matches.find((term) => term[0] === first && term[term.length - 1] === last);
        if (match) return match;
      }
    }

    return null;
  }

  function buildVariants(rawToken) {
    const edgeLeet = /[0-9@$!|+*€£#%^~`]/g;
    const stripped = rawToken.replace(
      new RegExp(`^${edgeLeet.source}+|${edgeLeet.source}+$`, "g"),
      ""
    );
    const wasEdgeStripped = stripped !== rawToken;
    const strippedIsClean = Boolean(stripped) && /^[a-z]+$/.test(stripped);
    const numericOnly = /^[0-9]+$/.test(rawToken);
    const candidates = Array.from(new Set([rawToken, stripped].filter(Boolean)));
    const entries = new Map();

    candidates.forEach((candidate) => {
      let variants = [""];
      let obfuscated = false;

      for (const character of candidate) {
        if (character >= "a" && character <= "z") {
          variants = variants.map((value) => value + character);
          continue;
        }

        if (LEET_OPTIONS[character]) {
          obfuscated = true;
          const options = LEET_OPTIONS[character];
          const next = [];
          for (const value of variants) {
            for (const option of options) next.push(value + option);
          }
          variants = next;
          if (variants.length > MAX_VARIANTS) variants = variants.slice(0, MAX_VARIANTS);
          continue;
        }

        // Punctuation inside a token acts as a separator.
        obfuscated = true;
      }

      if (!variants.length) variants = [""];

      const isStrippedCandidate = wasEdgeStripped && candidate === stripped;
      const skeletonEligible = obfuscated
        && !numericOnly
        && !isStrippedCandidate
        && !(candidate === rawToken && strippedIsClean);

      variants.forEach((value) => {
        const key = `${obfuscated ? "1" : "0"}:${value}`;
        const entry = { value, obfuscated, skeletonEligible };
        const existing = entries.get(key);
        if (!existing || skeletonEligible) entries.set(key, entry);
      });
    });

    return Array.from(entries.values());
  }

  function joinVariants(variantLists) {
    let results = [""];
    for (const list of variantLists) {
      const next = [];
      for (const prefix of results) {
        for (const value of list) {
          next.push(prefix + value);
          if (next.length >= MAX_VARIANTS) break;
        }
        if (next.length >= MAX_VARIANTS) break;
      }
      results = next;
      if (!results.length) return [];
    }
    return results;
  }

  function findInTokens(tokens) {
    for (let start = 0; start < tokens.length; start++) {
      for (let size = 1; size <= MAX_WINDOW && start + size <= tokens.length; size++) {
        const window = tokens.slice(start, start + size);
        const variants = joinVariants(window.map((token) => token.variants.map((entry) => entry.value)));
        const skeletonEligible = window.some((token) =>
          token.variants.some((entry) => entry.skeletonEligible)
        );
        const phraseIsDisguised = size === 1 || window.every((token) =>
          token.variants.every((entry) => entry.obfuscated || onlyLetters(entry.value).length <= 1)
        );
        const allowSkeleton = skeletonEligible && phraseIsDisguised;

        for (const candidate of variants) {
          const normalized = onlyLetters(candidate);
          const term = findTerm(normalized, allowSkeleton);
          if (term) return { term, normalized };
        }
      }
    }
    return null;
  }

  function findFirst(value) {
    const prepared = prepareText(value);
    if (!prepared) return null;

    const leetTokens = prepared
      .split(/[^a-z0-9@$!|+*€£#%^~`]+/g)
      .filter(Boolean)
      .map((rawToken) => {
        const variants = buildVariants(rawToken);
        return {
          variants,
          obfuscated: variants.some((entry) => entry.obfuscated),
        };
      });

    const separatorTokens = prepared
      .split(/[^a-z]+/g)
      .filter(Boolean)
      .map((rawToken) => ({
        variants: [{ value: rawToken, obfuscated: false }],
        obfuscated: false,
      }));

    return findInTokens(leetTokens) || findInTokens(separatorTokens);
  }

  function hasProfanity(value) {
    return findFirst(value) !== null;
  }

  function isClean(value) {
    return !hasProfanity(value);
  }

  function findProfanity(value) {
    const match = findFirst(value);
    return match ? [match] : [];
  }

  const api = {
    version: FILTER_VERSION,
    hasProfanity,
    isClean,
    findProfanity,
  };

  root.ProfanityFilter = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);

