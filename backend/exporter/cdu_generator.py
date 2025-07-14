def generate_cdu_from_blocks(blocks: list[dict]) -> str:
    lines = ["* CDU Generated from Control Diagram"]

    for block in blocks:
        block_type = block["type"].upper()
        name = block["label"]
        vin = ",".join(block.get("vin", []))
        vout = block["vout"]
        params = block.get("parameters", {})

        if block_type == "GAIN":
            K = params.get("K", 1.0)
            lines.append(f"{name} GAIN {vin} {vout} K={K}")
        elif block_type == "INTEGRATOR":
            T = params.get("T", 1.0)
            lines.append(f"{name} INT {vin} {vout} T={T}")
        elif block_type == "SUM":
            lines.append(f"{name} SUM {vin} {vout}")
        elif block_type == "INPUT":
            lines.append(f"{name} INP {vout}")
        elif block_type == "OUTPUT":
            lines.append(f"{name} OUT {vin[0]}")
        else:
            lines.append(f"* Unknown block type {block_type}")

    return "\n".join(lines)