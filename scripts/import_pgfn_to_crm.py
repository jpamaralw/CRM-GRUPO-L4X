"""Importa leads PGFN checkpoint para CRM via API. CRM deve estar rodando: npm run dev"""
import json, time, argparse, requests
from pathlib import Path

CHECKPOINT = Path(r"C:\Users\Usuario\Downloads\pgfn_checkpoint.json")

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--url", default="http://localhost:3000")
    args = p.parse_args()
    cp = json.loads(CHECKPOINT.read_text(encoding="utf-8"))
    leads = [{"cnpj": v.get("cnpj_raw", k), "nome": v.get("nome_pgfn",""), "valorDivida": v.get("valor_pgfn",""), "situacao": v.get("Situacao",""), "telefone": v.get("Tel_Celular_1") or v.get("Tel_Fixo_1",""), "email": v.get("Email_1",""), "endereco": v.get("Endereco",""), "origem": "PGFN"} for k,v in cp.items() if v.get("_status_texto","ok")=="ok"]
    print(f"[import] {len(leads)} leads")
    for i in range(0, len(leads), 100):
        r = requests.post(f"{args.url}/api/leads/import", json=leads[i:i+100], timeout=30)
        print(f"  [{i+100}/{len(leads)}] {r.json() if r.ok else r.status_code}")
        time.sleep(0.1)

if __name__ == "__main__":
    main()
