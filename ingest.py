import os
import json
import chromadb
from chromadb.utils import embedding_functions

def run_ingestion():

    data_path = os.path.join("data", "curriculum.json")
    
    if not os.path.exists(data_path):
        print(f"❌ Error: {data_path} not found! Please create the data folder and curriculum.json file first.")
        return

    with open(data_path, "r", encoding="utf-8") as f:
        curriculum_data = json.load(f)

    chroma_client = chromadb.PersistentClient(path="./chroma_db")
    emb_fn = embedding_functions.DefaultEmbeddingFunction()
    collection = chroma_client.get_or_create_collection(
        name="femmestry_curriculum",
        embedding_function=emb_fn
    )

    ids = []
    documents = []
    metadatas = []

    for item in curriculum_data:
        ids.append(item["id"])
        doc_text = f"Topic: {item['topic']}\nContent: {item['content']}"
        documents.append(doc_text)
        
        metadatas.append({
            "topic": item["topic"],
            "level": int(item.get("level", 1))
        })

    collection.upsert(
        ids=ids,
        documents=documents,
        metadatas=metadatas
    )

    print(f"✅ Successfully ingested {len(documents)} topics into ChromaDB vector store ('femmestry_curriculum')!")

if __name__ == "__main__":
    run_ingestion()