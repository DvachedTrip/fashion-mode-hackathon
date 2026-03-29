import os
import re
import tokenize
import io

def remove_js_comments(text):
    # Regex to remove js comments (// and /* */) without breaking strings
    pattern = re.compile(
        r'(?P<string>(?:"(?:\\.|[^"\\])*")|(?:\'(?:\\.|[^\'\\])*\')|(?:`(?:\\.|[^`\\])*`))|'
        r'(?P<comment>(?://.*?$)|(?:/\*.*?\*/))',
        re.MULTILINE | re.DOTALL
    )
    
    def replacer(match):
        if match.group('string') is not None:
            return match.group('string')
        else:
            return ''
            
    result = pattern.sub(replacer, text)
    # Remove empty lines left behind by the removed comments
    # To keep code somewhat readable but remove purely empty lines:
    lines = result.split('\n')
    cleaned_lines = []
    for line in lines:
        if line.strip() != '':
            cleaned_lines.append(line)
    return '\n'.join(cleaned_lines)

def remove_py_comments(text):
    io_obj = io.StringIO(text)
    out = ""
    try:
        tokens = tokenize.generate_tokens(io_obj.readline)
        filtered_tokens = []
        for tok in tokens:
            if tok[0] != tokenize.COMMENT:
                filtered_tokens.append(tok)
        out = tokenize.untokenize(filtered_tokens)
    except Exception as e:
        print(f"Error parsing python: {e}")
        return text 
    
    # Also clean up empty lines for python
    lines = out.split('\n')
    cleaned_lines = []
    for line in lines:
        # Keep indentation and empty lines? Wait, if we remove ALL empty lines, Python class structure 
        # might be hard to read, but the instructions say "убери все коментарии". 
        if line.strip() != '':
            cleaned_lines.append(line)
        else:
            # keeping some empty lines maybe? No, let's strip completely empty lines for aggressive cleaning
            pass
    return '\n'.join(cleaned_lines)

def process_directory(directory):
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in root or '.git' in root or '__pycache__' in root or 'venv' in root:
            continue
        for file in files:
            file_path = os.path.join(root, file)
            if file.endswith('.js') or file.endswith('.jsx'):
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                new_content = remove_js_comments(content)
                if new_content != content:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Removed comments from {file_path}")
            elif file.endswith('.py'):
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                new_content = remove_py_comments(content)
                if new_content != content:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Removed comments from {file_path}")

frontend_dir = os.path.join('d:\\\\', 'hakaton', 'fashion-mode-hackathon', 'frontend', 'src')
backend_dir = os.path.join('d:\\\\', 'hakaton', 'fashion-mode-hackathon', 'backend')

process_directory(frontend_dir)
process_directory(backend_dir)
print('Done!')
