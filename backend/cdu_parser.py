

import re
import pprint
import os
from dataclasses import dataclass, field
from typing import List, Optional

def extrair_cdu(caminho_arquivo: str, tipo: str) -> List[List[str]]:
    """
    Lê o arquivo em `caminho_arquivo` e extrai todos os blocos CDU 
    que começam com a linha `tipo` e terminam em 'FIMCDU'.
    Linhas em branco e comentários (linhas começando com '(') são ignorados.
    """
    lista_cdu: List[List[str]] = []

    if not os.path.exists(caminho_arquivo):
        print(f"Erro: Arquivo não encontrado em '{caminho_arquivo}'.")
        return lista_cdu

    with open(caminho_arquivo, 'r', encoding='utf-8', errors='ignore') as f:
        todas_linhas = f.readlines()

    linhas_cdu_atual: List[str] = []
    processando_bloco = False
    capturando_cdu = False

    for linha_original in todas_linhas:
        linha_processada = linha_original.strip()
        # pula linhas vazias
        if not linha_processada:
            continue
        # pula comentários
        if linha_processada.startswith('('):
            continue

        # sinal de fim de bloco geral
        if linha_processada == '999999':
            if processando_bloco:
                processando_bloco = False
                if capturando_cdu:
                    linhas_cdu_atual.clear()
                    capturando_cdu = False
            continue

        # fim de CDU: adiciona e encerra captura
        if capturando_cdu and linha_processada.upper() == 'FIMCDU':
            linhas_cdu_atual.append(linha_original.rstrip('\n'))
            lista_cdu.append(linhas_cdu_atual.copy())
            linhas_cdu_atual.clear()
            capturando_cdu = False
            continue

        # se já estamos capturando, só acumula linhas
        if capturando_cdu:
            linhas_cdu_atual.append(linha_original.rstrip('\n'))
        else:
            # se não estamos capturando, observamos marca de início
            if linha_processada.upper() == tipo.upper():
                processando_bloco = True
                capturando_cdu = False
                linhas_cdu_atual.clear()
            elif processando_bloco:
                # qualquer linha não-vazia após o tipo inicia a seção CDU
                if linha_processada.upper() != 'FIMCDU':
                    capturando_cdu = True
                    linhas_cdu_atual.clear()
                    linhas_cdu_atual.append(linha_original.rstrip('\n'))

    return lista_cdu

@dataclass
class DEFPAR:
    nome: str
    valor: float
    descricao: str = ""

    @classmethod
    def from_line(cls, s: str) -> 'DEFPAR':
        s = s.ljust(71)
        nome = s[7:13].strip()
        valor = float(s[14:32].strip())
        descricao = s[32:].strip()
        return cls(nome, valor, descricao)

@dataclass
class DEFVAL:
    stip: str
    vdef: str
    d1: str
    o: str
    d2: str

    @classmethod
    def from_line(cls, linha: str) -> 'DEFVAL':
        linha = linha.ljust(71)
        stip = linha[7:13].strip()
        vdef = linha[14:20].strip()
        d1 = linha[21:27].strip()
        o = linha[28]
        d2 = linha[29:35].strip()
        return cls(stip, vdef, d1, o, d2)

@dataclass
class Bloco:
    nb: int
    i: str
    tipo: str
    o: str
    stip: str
    s: List[str] = field(default_factory=list)
    vent: List[str] = field(default_factory=list)
    vsai: str = ""
    p1: List[str] = field(default_factory=list)
    p2: List[str] = field(default_factory=list)
    p3: List[str] = field(default_factory=list)
    p4: List[str] = field(default_factory=list)
    vmin: str = ""
    vmax: str = ""
    parent_dcdu: Optional['DCDU'] = None

    @classmethod
    def from_line(cls, linha: str) -> 'Bloco':
        linha = linha.ljust(71)
        nb = int(linha[0:4].strip())
        i = linha[4]
        tipo = linha[5:11].strip()
        o = linha[11]
        stip = linha[12:18].strip().replace(".", "")
        s = [linha[18]]
        vent = [linha[19:25].strip()]
        vsai = linha[26:32].strip()
        p1 = [linha[33:39].strip()]
        p2 = [linha[39:45].strip()]
        p3 = [linha[45:51].strip()]
        p4 = [linha[51:57].strip()]
        vmin = linha[58:64].strip()
        vmax = linha[65:71].strip()
        return cls(nb, i, tipo, o, stip, s, vent, vsai, p1, p2, p3, p4, vmin, vmax)

    def adiciona_linha(self, linha: str):
        linha = linha.ljust(71)
        self.s.append(linha[18])
        extra = linha[19:25]
        if extra.strip():
            self.vent.append(extra.strip())
        extra_vsai = linha[26:32]
        if extra_vsai.strip():
            self.vsai = extra_vsai.strip()
        for idx, attr in enumerate(['p1','p2','p3','p4'], start=33):
            start = idx + (idx-33)*6
            end = start + 6
            segment = linha[start:end]
            if segment.strip():
                getattr(self, attr).append(segment.strip())

@dataclass
class DCDU:
    texto: List[str]
    ncdu: int = 0
    nome: str = ""
    par: List[DEFPAR] = field(default_factory=list)
    imports: List[Bloco] = field(default_factory=list)
    exports: List[Bloco] = field(default_factory=list)
    entrads: List[Bloco] = field(default_factory=list)
    blocos: List[Bloco] = field(default_factory=list)
    defvals: List[DEFVAL] = field(default_factory=list)

    @property
    def variables(self) -> List[str]:
        vars_ = [b.vsai for b in self.imports]
        vars_ += [b.vsai for b in self.entrads]
        vars_ += [b.vsai for b in self.blocos]
        return vars_

    def is_variable(self, nome: str) -> bool:
        return any(v.lower() == nome.lower() for v in self.variables)

    def get_par(self, nome: str) -> float:
        for p in self.par:
            if p.nome.lower() == nome.lower():
                return p.valor
        return 0.0

    def get_val(self, nome: str) -> float:
        for dv in self.defvals:
            if dv.vdef.lower() == nome.lower():
                try:
                    return float(dv.d1)
                except ValueError:
                    return self.get_par(dv.d1)
        return float('-inf')

def ler_dcdu_completo(texto: List[str]) -> DCDU:
    d = DCDU(texto)
    # Cabeçalho
    if texto:
        header = texto[0]
        d.nome = ''.join(c for c in header[7:].strip() if c.isalnum())
        try:
            d.ncdu = int(header[:6].strip())
        except ValueError:
            d.ncdu = 0
    # Percorre linhas
    i = 1
    while i < len(texto):
        s = texto[i]
        try:
            if s.upper().startswith('FIMCDU'):
                break
            if s.startswith('(') or not s.strip():
                i += 1
                continue
            up = s.upper()
            if up.startswith('DEFPAR'):
                d.par.append(DEFPAR.from_line(s))
            elif up.startswith('DEFVAL'):
                d.defvals.append(DEFVAL.from_line(s))
            else:
                bloco = None
                tipo = s[5:11].strip().upper()
                stipo = s[12:18].strip().upper().replace(".", "")
                if not tipo:
                    i += 1
                    continue
                # Mapping casos simplificado
                bloco = Bloco.from_line(s)
                # captura linhas extras conforme tipo
                if tipo in {'ACUM', 'INTRES', 'COMPAR'}:
                    lines_needed = {'ACUM':3, 'INTRES':2, 'COMPAR':1}[tipo]
                    for _ in range(lines_needed):
                        i += 1
                        bloco.adiciona_linha(texto[i])
                elif tipo in {'DIVSAO','PONTOS','MAX','MIN','MULTPL','SOMA'}:
                    while True:
                        peek = texto[i+1][5:11].strip().upper() if i+1 < len(texto) else ''
                        if peek or texto[i+1].upper().startswith('FIMCDU'):
                            break
                        i += 1
                        bloco.adiciona_linha(texto[i])
                #elif tipo in {'COMPAR','FUNCAO','LOGIC'}:
                #    pass
                if tipo == 'ENTRAD':
                    d.entrads.append(bloco)
                elif tipo == 'EXPORT':
                    d.exports.append(bloco)
                elif tipo == 'IMPORT':
                    d.imports.append(bloco)
                else:
                    d.blocos.append(bloco)
        except Exception:
            pass
        i += 1
    # link parent
    for b in d.blocos + d.entrads + d.imports + d.exports:
        b.parent_dcdu = d
    return d