from app.services.retrieval import retrieve_similar_chunks

if __name__ == "__main__":
    results = retrieve_similar_chunks("What Python experience is required?")
    for r in results:
        print(f"[{r['source']}] distance={r['distance']:.4f}")
        print(r['content'][:150])
        print("---")