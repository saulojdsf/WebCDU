import json
from cdu_parser import ler_dcdu_completo, DCDU, Bloco

def dcdu_to_reactflow(d: DCDU) -> dict:
    # 1) collect all blocks in one list
    all_blocks = d.entrads + d.imports + d.blocos + d.exports

    # 2) build var → node_id index
    var_to_node = {}
    for b in all_blocks:
        node_id = f"{b.nb:04d}"
        if b.vsai:
            var_to_node[b.vsai] = node_id

    nodes = []
    for b in all_blocks:
        node_id = f"{b.nb:04d}"
        node_type = b.tipo.lower()
        if node_type == "funcao":
            node_type = b.stip.lower()
            if node_type == "x**2":
                node_type = "x2"
        data = {
            "label": b.tipo.title(),
            "id": node_id,
            "Vout": b.vsai
        }

        # pack inputs: if more than one vent, bracket them
        if b.vent:
            if len(b.vent) == 1:
                data["Vin"] = b.vent[0]
            else:
                # you could also split into Vin, Vin2, etc.
                data["Vin"] = f"[{','.join(b.vent)}]"

        # include any parameters that exist
        # e.g. p1…p4, vmin/vmax, stip for imports/exports
        if getattr(b, "p1", None):
            data["P1"] = b.p1[0]
        if getattr(b, "p2", None):
            data["P2"] = b.p2[0]
        if getattr(b, "vmin", None):
            data["Vmin"] = b.vmin
        if getattr(b, "vmax", None):
            data["Vmax"] = b.vmax
        if getattr(b, "stip", None):
            data["stip"] = b.stip

        nodes.append({
            "id": node_id,
            "type": node_type,
            "position": {"x": 0, "y": 0},
            "data": data
        })

    # 3) build edges by following each block's vent list
    edges = []
    for b in all_blocks:
        tgt = f"{b.nb:04d}"
        for idx, vin in enumerate(b.vent, start=1):
            src = var_to_node.get(vin)
            if not src:
                continue
            # key the edge id to distinguish multiple inputs
            suffix = f"vin{idx}" if idx>1 else "vin"
            edge_id = f"reactflow__edge-{src}vout-{tgt}{suffix}"
            edges.append({
                "id": edge_id,
                "source": src,
                "target": tgt,
                "type": "default"
            })

    return {
        "nodes": nodes,
        "edges": edges,
        # you can add drawingData, groupData, parameters here as needed
        "drawingData": {"version":"1.0.0","strokes":[],"shapes":[]},
        "groupData": {"groups":[],"selectedGroupIds":[],"groupCounter":[]},
        "parameters": []
    }