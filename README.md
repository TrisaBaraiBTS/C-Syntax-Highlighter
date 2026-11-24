# C Syntax Highlighter & Lexical Analyzer

A modern, responsive web-based **C Syntax Highlighter** and **Lexical Analyzer** built for the **Compiler Design** college subject using pure **HTML5, CSS3, and JavaScript** (zero external dependencies).

---

## 📖 Project Overview

In compiler construction, the **Lexical Analyzer (Scanner)** is the first phase of the compiler front-end. Its primary duty is to read the raw input stream of characters from a source program, group them into meaningful character sequences called **lexemes**, and translate them into a sequence of **tokens**.

This project implements a custom deterministic lexical analyzer that tokenizes C source code in real time, applies visual syntax highlighting through a synchronized dual-layer code editor, computes token frequency statistics, and renders an interactive, filterable **Token Analysis Table**.

---

## 🎯 Academic Concepts Demonstrated

### 1. Lexeme, Token, and Pattern
* **Lexeme:** The concrete sequence of characters in the source code matching a pattern (e.g., `int`, `counter`, `3.1415`, `==`, `"Hello"`).
* **Token:** An abstract symbol representing the grammatical category of the lexeme (e.g., `<KEYWORD>`, `<IDENTIFIER>`, `<CONSTANT_FLOAT>`, `<OPERATOR>`).
* **Pattern:** The formal description of the form that lexemes of a token can take (regular expressions / grammars).

### 2. The Principle of Longest Match (Maximal Munch)
When scanning operators, the lexer selects the longest valid token that matches the input prefix:
* Input `++`: Treated as single `<OPERATOR, "++">`, not two `<OPERATOR, "+">` tokens.
* Input `->`: Treated as single member-access operator `<OPERATOR, "->">`.
* Input `==`: Evaluated as equality operator `<OPERATOR, "==">` rather than two assignment operators.

### 3. Keyword vs. Identifier Resolution (Lookup Table Method)
Identifiers and keywords share the exact same lexical pattern: `[a-zA-Z_][a-zA-Z0-9_]*`. Rather than building complex DFA branches for each keyword, the lexer:
1. Scans the complete identifier word.
2. Performs an $O(1)$ lookup in a pre-populated `Set` of ANSI C / C99 reserved keywords.
3. Classifies the token as `KEYWORD` if present; otherwise assigns `IDENTIFIER`.

---

## ✨ Features

- **Custom Lexical Analyzer (No External Libraries):**
  - Handcrafted character-by-character scanner in vanilla JavaScript.
  - No `Prism.js`, `Highlight.js`, or third-party tokenizers.
- **Comprehensive C Token Support:**
  - **Keywords:** `int`, `float`, `char`, `if`, `else`, `while`, `for`, `return`, `struct`, `sizeof`, `typedef`, etc.
  - **Identifiers:** User-defined functions, variables, and type names.
  - **Numeric Constants:** Decimal integers, Hexadecimal (`0x1A`), Binary (`0b1011`), Floats (`3.14`), and Exponentials (`1e-5`, `42.75e-2`).
  - **String & Character Literals:** Double-quoted strings and single-quoted chars with escape sequence support (`\"`, `\'`, `\n`, `\t`).
  - **Operators:** Arithmetic, relational, logical, bitwise, assignment, and pointer member operators.
  - **Delimiters & Punctuators:** `(`, `)`, `{`, `}`, `[`, `]`, `;`, `,`.
  - **Preprocessor Directives:** `#include`, `#define`, `#ifdef`, etc.
  - **Comments:** Single-line (`// ...`) and multi-line (`/* ... */`).
- **VS Code Inspired Code Editor:**
  - Dual-layer overlay architecture (editable `<textarea>` + syntax highlighted `<pre><code>`).
  - Synchronized scrolling (vertical and horizontal) between code, highlight, and line numbers gutter.
  - Tab key support (inserts 4 spaces instead of shifting focus).
  - Cursor position tracking (Line and Column numbers).
- **Token Analytics Dashboard:**
  - Real-time count of total tokens, keywords, identifiers, constants, operators, strings, comments, and preprocessor statements.
- **Interactive Token Analysis Table:**
  - Lists every recognized token with Token Index, Lexeme, Category Badge, and Line/Col coordinates.
  - Filter by token category (Keywords, Identifiers, Constants, Operators, etc.).
  - Real-time search bar to search for specific lexemes or token types.
  - **Export to CSV and JSON:** One-click download for lab documentation and project viva reports.
- **Pre-Loaded Sample Programs:**
  - `Hello World & Preprocessor`
  - `Factorial & Pointers (Recursion)`
  - `Bubble Sort & Arrays`
  - `Structs, Floats, Hex Constants & Multi-line Comments`
- **Security & Stability:**
  - Strict HTML entity escaping to prevent XSS / script injection attacks.
  - Unknown character fallback to prevent infinite loops.

---

## 📂 Project Structure

```
C-Syntax-Highlighter/
├── index.html        # Main HTML layout (Editor, Analytics Dashboard, Token Table)
├── style.css         # Modern dark theme styles, token color schemes, responsive grid
├── script.js         # Custom CLexer class, Sample programs, UI controller
└── README.md         # Comprehensive documentation & compiler design guide
```

---

## 🎨 Token Color Palette

| Token Category | Color Code | Description |
| :--- | :--- | :--- |
| **Preprocessor** | `#c586c0` (Mauve / Purple) | `#include`, `#define`, `#pragma` |
| **Keyword** | `#569cd6` (Blue, Bold) | `int`, `return`, `if`, `while`, `struct` |
| **Identifier** | `#9cdcfe` (Light Ice Blue) | `main`, `printf`, `count`, `result` |
| **Operator** | `#d4d4d4` (Light Gray, Bold) | `+`, `-`, `*`, `==`, `!=`, `->`, `++` |
| **Constant** | `#b5cea8` (Sage Green) | `10`, `0x1A`, `3.14f`, `1e-5` |
| **String / Char** | `#ce9178` (Amber / Coral) | `"Hello\n"`, `'a'`, `'\0'` |
| **Comment** | `#6a9955` (Forest Green, Italic) | `// comment`, `/* multi-line */` |
| **Delimiter** | `#ffd700` (Gold / Yellow) | `(`, `)`, `{`, `}`, `;`, `,` |

---

## 🚀 How to Run

1. Clone or download this repository.
2. Open `index.html` directly in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).
3. No build tools, Node.js, web server, or dependencies required!

---

## 🧪 Testing with Sample Code

You can select any of the 4 pre-configured programs from the **Sample Program** dropdown and click **Load**, or paste your own C code into the editor.

### Example C Code:
```c
#include <stdio.h>

#define PI 3.14159

int main() {
    // Calculate circle area
    float radius = 5.0f;
    float area = PI * radius * radius;
    printf("Area: %.2f\n", area);
    return 0;
}
```

The application will immediately:
1. Highlight all tokens with corresponding colors.
2. Display the total token count and category breakdown.
3. Populate the Token Analysis Table with detailed coordinates (`Line : Col`).

---

## 🎓 College Viva / Interview Questions & Answers

1. **Q: Why is lexical analysis separated from syntax analysis?**
   * *A:* Separation of concerns simplifies compiler design, enhances portability, improves compiler efficiency (lexical scanning spends ~50% of compile time), and allows specialized algorithms (DFAs for lexical vs. CFGs/Pushdown Automata for parsing).

2. **Q: How does this project handle lookahead?**
   * *A:* Through the `peek()` method. When examining multi-character operators (like `==`, `!=`, `->`), the scanner looks 1 or 2 characters ahead without advancing the cursor.

3. **Q: What happens if an unrecognized character like `@` is typed?**
   * *A:* The lexer safely captures it under the `UNKNOWN` token type, increments the cursor, and underlines it in red without crashing the editor.

---

## 📜 License
This project is open-source and free to use for academic, demonstration, and learning purposes.
