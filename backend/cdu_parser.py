

import re
import pprint

def extract_dcdu_blocks(file_path):
    """
    Extracts DCDU blocks from a .cdu or .dat file.

    A DCDU block starts with a line containing 'DCDU' and ends with 'FIMCDU'.
    This function ignores comment lines starting with '('.

    Args:
        file_path (str): The path to the .cdu file.

    Returns:
        list: A list of lists, where each inner list contains the lines of a DCDU block.
    """
    all_dcdu_blocks = []
    current_block = []
    in_dcdu_block = False

    try:
        with open(file_path, 'r') as f:
            for line in f:
                stripped_line = line.strip()

                if not stripped_line or stripped_line.startswith('('):
                    continue

                if "DCDU" in stripped_line.upper() and not in_dcdu_block:
                    # Check if the line contains DCDU and is not just a comment
                    # This is the start of a potential block
                    # The C# code seems to start capturing after the 'DCDU' keyword line itself
                    # but the first line of the block is the one with the DCDU name.
                    # Let's assume the line with DCDU name marks the start.
                    if re.match(r'^\s*\d+\s+[A-Z0-9_]+', stripped_line):
                         in_dcdu_block = True
                         current_block = [line] # Start of a new block
                         continue

                if in_dcdu_block:
                    current_block.append(line)
                    if "FIMCDU" in stripped_line.upper():
                        all_dcdu_blocks.append(current_block)
                        current_block = []
                        in_dcdu_block = False
    except FileNotFoundError:
        print(f"Error: File not found at {file_path}")
        return []
    except Exception as e:
        print(f"An error occurred: {e}")
        return []

    return all_dcdu_blocks

def parse_dcdu_block(block_lines):
    """
    Parses a single DCDU block into a structured dictionary.

    Args:
        block_lines (list): A list of strings representing one DCDU block.

    Returns:
        dict: A dictionary containing the parsed data of the DCDU block.
    """
    if not block_lines:
        return {}

    dcdu_data = {
        'name': '',
        'ncdu': 0,
        'params': [],
        'defvals': [],
        'imports': [],
        'exports': [],
        'entradas': [],
        'blocos': []
    }

    # Parse header line
    header = block_lines[0]
    dcdu_data['name'] = ''.join(filter(str.isalnum, header[7:].strip()))
    dcdu_data['ncdu'] = int(header[:6].strip())

    # Helper to parse a single fixed-width line into a bloco dictionary
    def parse_bloco_line(line):
        padded_line = line.rstrip('\n').ljust(71)
        return {
            'nb': padded_line[0:4].strip(),
            'i': padded_line[4],
            'tipo': padded_line[5:11].strip(),
            'o': padded_line[11],
            'stip': padded_line[12:18].strip(),
            's': [padded_line[18]],
            'vent': [padded_line[19:25].strip()],
            'vsai': padded_line[26:32].strip(),
            'p1': [padded_line[33:39].strip()],
            'p2': [padded_line[39:45].strip()],
            'p3': [padded_line[45:51].strip()],
            'p4': [padded_line[51:57].strip()],
            'vmin': padded_line[58:64].strip(),
            'vmax': padded_line[65:71].strip(),
        }

    # Helper to add a continuation line to an existing bloco
    def add_continuation_line(bloco, line):
        padded_line = line.rstrip('\n').ljust(71)
        bloco['s'].append(padded_line[18])
        if padded_line[19:25].strip():
            bloco['vent'].append(padded_line[19:25].strip())
        if padded_line[26:32].strip():
            bloco['vsai'] = padded_line[26:32].strip()
        if padded_line[33:39].strip():
            bloco['p1'].append(padded_line[33:39].strip())
        #... and so on for p2, p3, p4
        if padded_line[39:45].strip():
            bloco['p2'].append(padded_line[39:45].strip())
        if padded_line[45:51].strip():
            bloco['p3'].append(padded_line[45:51].strip())
        if padded_line[51:57].strip():
            bloco['p4'].append(padded_line[51:57].strip())


    # Process lines
    lines_iterator = iter(enumerate(block_lines))
    for i, line in lines_iterator:
        if i == 0 or "FIMCDU" in line.upper() or line.strip().startswith('('):
            continue

        line_upper = line.upper()
        
        if line_upper.startswith("DEFPAR"):
            # Simplified parsing for DEFPAR
            dcdu_data['params'].append(line.strip())
        elif line_upper.startswith("DEFVAL"):
            # Simplified parsing for DEFVAL
            dcdu_data['defvals'].append(line.strip())
        else:
            # This is a standard bloco
            bloco = parse_bloco_line(line)
            tipo = bloco['tipo'].upper()

            # These are the block types that can have continuation lines
            multi_line_types = [
                "ACUM", "COMPAR", "DIVSAO", "FUNCAO", "INTRES", "LOGIC", 
                "MAX", "MIN", "MULTPL", "POL(S)", "S/HOLD", "SELET2", "SOMA", "T/HOLD"
            ]

            # Specific handling for multi-line blocks based on C# logic
            if tipo in multi_line_types:
                # Peek ahead to see if the next lines are continuations
                while (i + 1) < len(block_lines):
                    next_line = block_lines[i + 1]
                    # Continuation lines have a blank 'tipo' field
                    if next_line[5:11].strip() == "" and not next_line.strip().startswith('('):
                        add_continuation_line(bloco, next_line)
                        # Advance the main iterator to skip the line we just consumed
                        next(lines_iterator)
                        i += 1
                    else:
                        break # Not a continuation line

            # Categorize the block
            if tipo == "IMPORT":
                dcdu_data['imports'].append(bloco)
            elif tipo == "EXPORT":
                dcdu_data['exports'].append(bloco)
            elif tipo == "ENTRAD":
                dcdu_data['entradas'].append(bloco)
            else:
                dcdu_data['blocos'].append(bloco)

    return dcdu_data

if __name__ == '__main__':
    # You need to have a .cdu file in the same directory as the script,
    # or provide an absolute path to your file.
    # For this example, let's assume a file named 'sample.cdu' exists.
    
    # Create a dummy file for testing
    cdu_content = """
(
( CDU GERADO PELO PROGRAMA DE CONVERSAO DE DIAGRAMAS DE CONTROLE VERSAO 2.0
(
(******************************************************************************)
(**** CDU DO ESTABILIZADOR DA UHE SAO SALVADOR                           *****)
(******************************************************************************)
      1 PSSBR   DCDU
DEFPAR K         0.0     GANHO DO ESTABILIZADOR
DEFPAR T1        0.0     CONSTANTE DE TEMPO DO FILTRO
DEFPAR T2        0.0     CONSTANTE DE TEMPO DO FILTRO
DEFPAR T3        0.0     CONSTANTE DE TEMPO DO BLOCO DE AVANCO
DEFPAR T4        0.0     CONSTANTE DE TEMPO DO BLOCO DE ATRASO
DEFPAR T5        0.0     CONSTANTE DE TEMPO DO BLOCO DE AVANCO
DEFPAR T6        0.0     CONSTANTE DE TEMPO DO BLOCO DE ATRASO
DEFPAR VSMAX     0.0     LIMITE MAXIMO DA SAIDA
DEFPAR VSMIN     0.0     LIMITE MINIMO DA SAIDA
    100 IMPORT P        1 VELOCIDADE DA MAQUINA
    101 IMPORT Pe       1 POTENCIA ELETRICA
    102 EXPORT Vstab    1 SINAL DE SAIDA DO ESTABILIZADOR
    103 ENTRAD Vref     0 TENSAO DE REFERENCIA
      1 I SOMA   O      +     PE      VSTAB                -1.0
                                      P                           1.0
      2 I GANHO  O            ENT1    ENT2    K
      3 I POL(S) O            ENT2    ENT3    T1       T2
FIMCDU
999999
"""
    file_name = 'sample.cdu'
    with open(file_name, 'w') as f:
        f.write(cdu_content)

    print(f"Created dummy CDU file: {file_name}")
    
    dcdu_blocks = extract_dcdu_blocks(file_name)

    if not dcdu_blocks:
        print("No DCDU blocks found.")
    else:
        print(f"Found {len(dcdu_blocks)} DCDU block(s).\n")
        for i, block in enumerate(dcdu_blocks):
            print(f"--- Parsing Block {i+1} ---")
            parsed_data = parse_dcdu_block(block)
            pprint.pprint(parsed_data)
            print("\n")

