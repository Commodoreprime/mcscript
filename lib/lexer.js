const fs = require('fs');

// InputStream
function InputStream(input, file = '') {
    if (file) file = ' in file ' + file;
    let pos = 0, line = 1, col = 0;

    // Export Methods
    return {
        next: next,
        peek: peek,
        peekNext: peekNext,
        getCol: getCol,
        eof: eof,
        croak: croak,
        debugError: debugError
    };

    // next Method returns next token
    function next() {

        const ch = input.charAt(pos++);

        if (ch === "\n") {

            if (",;(){[".indexOf(input.charAt(pos--)) === -1) {

                input[pos] = ";"

            }

            pos++;
            line++;
            col = 0

        }

        else col++;
        return ch;

    }

    // Peek() method Get Token from later in the file without skipping
    function peek() {

        return input.charAt(pos);

    }

    // Peek() method Get Token from later in the file without skipping
    function peekNext(num) {

        return input.charAt(pos + num);

    }


    //
    function getCol() {

        let num = col;
        let pos2 = pos - 1;

        while (" \r\n\t".indexOf(input.charAt(pos2)) >= 0 && num >= 1) {

            pos2--;
            num--

        }

        return num

    }

    // eof() Method: Test if end of file is reached
    function eof() {

        return peek() === "";

    }


    // Throws an error with actual position in File
    function croak(msg) {
        throw new Error(msg + " (" + (line - 1) + ":" + col + ")" + file);
    }

    function debugError(msg, type) {
        let filer = file.split("/");
        console.log(filer, file);
        filer = filer[filer.length - 1];
        if (type === "err") throw new Error("[Debug](" + (line - 1) + ":" + col + "|" + filer + ") " + msg);
        else if (type === "break") throw new Error("[Brake](brake at " + (line - 1) + ":" + col + "|" + filer + ") " + msg)
    }
}

// TokenStream (File formatter)
function TokenStream(input) {

    let current = null;

    // Keywords
    const keywords = " if then else true false for as at asat positioned modal align dimension rotated"
        + " anchored while do forEach raycast stop continue switch case default var bool"
        + " boolean tag score const override function run ";
    const operators = "+-*/%=&|<>!";
    const puncs = ",;:(){}[]";
    const whitespaces = " \r\n\t";


    // Export Functions
    return {
        next: next,
        peek: peek,
        eof: eof,
        croak: input.croak,
        debugError: input.debugError
    };

    // is_keyword method: test if character is keyword
    function is_keyword(x) {
        return keywords.indexOf(" " + x + " ") >= 0;
    }

    // is_digit method: test if character is a digit
    function is_digit(ch) {
        return /[0-9]/i.test(ch);
    }

    // is_id_start method: test if character is id start
    function is_id_start(ch) {
        return /[a-zÎ»_.]/i.test(ch);
    }

    // is_id method: test if character is id
    function is_id(ch) {
        return is_id_start(ch) || "?!-<>=0123456789".indexOf(ch) >= 0;
    }

    // is_op_char method: test if character is operator
    function is_op_char(ch) {
        return operators.indexOf(ch) >= 0;
    }

    // is_punc method: test if character is punc
    function is_punc(ch) {
        return puncs.indexOf(ch) >= 0;
    }

    // is_whitespace method: test if caracter is a witespace
    function is_whitespace(ch) {
        return whitespaces.indexOf(ch) >= 0;
    }

    // read_while method: read while given function returns true to peek
    function read_while(predicate) {

        let str = "";

        while (!input.eof() && predicate(input.peek())) {
            str += input.next();
        }

        return str;

    }

    //read_number method: read to end of number
    function read_number() {

        let has_dot = false;

        const number = read_while(function (ch) {

            if (ch === ".") {

                if (has_dot) return false;
                has_dot = true;
                return true;

            }

            return is_digit(ch); // check next char is digit, if not cancel

        });

        return {type: "num", value: parseFloat(number)}; // Return number object

    }

    //read_ident method: read full intendent
    function read_ident() {

        const id = read_while(is_id);

        return {
            type: is_keyword(id) ? "kw" : "var",
            value: id
        };

    }

    // read_escaped method: read escaped content
    function read_escaped(end) {

        let escaped = false, str = "";

        input.next();

        while (!input.eof()) {

            const ch = input.next();

            if (escaped) {
                str += ch;
                escaped = false;
            } else if (ch === "\\") {
                escaped = true;
            } else if (ch === end) {
                break;
            } else {
                str += ch;
            }

        }

        return str;

    }

    // read_string method: Read Strings starting with "
    function read_string() {
        return {type: "str", value: read_escaped('"')};
    }


    // read_string2 method: Read Strings starting with '
    function read_string2() {
        return {type: "str", value: read_escaped("'")};
    }

    // skip_comment method: skip a comment
    function skip_comment() {
        read_while(function (ch) {
            return ch !== "\n"
        });
        input.next();
    }

    function skip_line_comment() {
        read_while(function (ch) {
            return ch !== "*" || input.peekNext(1) !== "/"
        });
        input.next();
        input.next();
        input.next()
    }

    // readSelector method: read a selector
    function readSelector() {
        let value = input.next() + input.next();

        if (input.peek() === "[") {
            value += read_while(function (ch) {
                return ch !== "]"
            }) + input.next()
        }

        return {type: "selector", value: value}
    }


    // read_comment method: Transfer comments starting with #
    function read_comment() {
        return {
            type: "comment", value: read_while(function (ch) {
                return ch !== "\n" && ch !== ";"
            })
        }
    }

    function read_debug() {
        console.log("he");
        return {
            type: "debugger", value: read_while(function (ch) {
                return ch !== "\n" && ch !== ";"
            })
        }
    }

    // read_command method: Transfer commands starting with /
    function read_command() {
        let command = read_while(function (ch) {
            return ch !== "\n" && ch !== ";"
        });
        if (command[0] === "/") command = command.substr(1);
        return {type: "command", value: command.split('run: ').join("")}
    }

    // read_next method: read next token
    function read_next() {

        // skip whitespaces
        read_while(is_whitespace);
        if (input.eof()) return null;

        // read next token
        const ch = input.peek();

        // skip comment
        if (ch === "/" && input.peekNext(1) === "/") {
            skip_comment();
            return read_next();
        }

        // skip line comment
        if (ch === "/" && input.peekNext(1) === "*") {
            skip_line_comment();
            read_next();
            return read_next()
        }

        // Transfer command
        if (ch === "r" && input.peekNext(1) === "u" && input.peekNext(2) === "n" && input.peekNext(3) === ":") {
            return read_command();
        }
        if (ch === "d" && input.peekNext(1) === "e" && input.peekNext(2) === "b" && input.peekNext(3) === "u" && input.peekNext(4) === "g") {
            return read_debug();
        }

        // Transfer command
        if (ch === "/" && input.getCol() === 0) {
            return read_command();
        }

        // Replace variable
        if (ch === "$") {
            if (input.peekNext(1) === "(") {
                let res = {
                    type: "num", value: read_while(function (ch) {
                        return ch !== ")"
                    }) + ")"
                };
                input.next();
                return res
            }
        }

        // Transfer mcfunction comment
        if (ch === "#") {
            return read_comment()
        }

        //read selector
        if (ch === "@") return readSelector();

        // read string
        if (ch === '"') return read_string();

        // read string2
        if (ch === "'") return read_string2();

        // read digit
        if (is_digit(ch)) return read_number();

        // read id
        if (is_id_start(ch)) return read_ident();

        // read punc
        if (is_punc(ch)) return {
            type: "punc",
            value: input.next()
        };

        // read operator
        if (is_op_char(ch)) return {
            type: "op",
            value: read_while(is_op_char)
        };

        // error, if can't handle
        input.croak("Can't handle character: " + JSON.stringify(ch));
    }

    // peek method: get next character
    function peek() {
        return current || (current = read_next());
    }

    // next method: go to next character
    function next() {
        const tok = current;
        current = null;
        return tok || read_next();
    }

    function eof() {
        return peek() === null;
    }
}

// exports
exports.lexer = function (str, file = '') {

    // Test code
    /*
    let output = TokenStream(InputStream(str))
    let array = []
    let iscurrent = true
    while(iscurrent){
      let d = output.next()
      if(d){
        array.push(d)
        iscurrent = true
      } else iscurrent = false
    }
    console.log(array)
    */


    return TokenStream(InputStream(str, file)) // export TokenStream
};
