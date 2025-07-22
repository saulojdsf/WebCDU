from cdu_parser import extrair_cdu, ler_dcdu_completo
from cdu_json_converter import dcdu_to_reactflow
import json

def main():
    cdu_file = "C:/Users/saulo/WebCDU/backend/test/RT_FUNIL.cdu"
    cdu = extrair_cdu(cdu_file, "DCDU")
    cdu_completo = ler_dcdu_completo(cdu[0])
    cdu_json = dcdu_to_reactflow(cdu_completo)
    with open("C:/Users/saulo/WebCDU/backend/test/cdu_json.json", "w") as f:
        f.write(json.dumps(cdu_json, indent=4))
if __name__ == "__main__":
    main()