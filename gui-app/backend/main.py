from flask import Flask, request, jsonify
from flask_cors import CORS
from collections import deque

app = Flask(__name__)
CORS(app)


def build_adj(num_nodes, edges):
    """Build adjacency list from edge strings like '0-1'."""
    graph = {i: [] for i in range(num_nodes)}
    for edge in edges:
        parts = edge.split("-")
        a, b = int(parts[0]), int(parts[1])
        if b not in graph[a]:
            graph[a].append(b)
        if a not in graph[b]:
            graph[b].append(a)
    return graph


def run_dfs(graph, start, num_nodes):
    """Iterative DFS. Returns list of step snapshots."""
    visited_set = set()
    stack = [start]
    steps = []

    while stack:
        node = stack.pop()
        if node in visited_set:
            continue
        visited_set.add(node)
        steps.append({
            "current": node,
            "visited": list(visited_set),
            "frontier": list(stack),
            "description": f"DFS — Pop node {node} from stack. Mark visited."
        })
        # Push neighbours in reverse sorted order so smallest visits first
        for neighbour in sorted(graph.get(node, []), reverse=True):
            if neighbour not in visited_set:
                stack.append(neighbour)

    return steps


def run_bfs(graph, start, num_nodes):
    """BFS. Returns list of step snapshots."""
    visited_set = {start}
    queue = deque([start])
    steps = []

    while queue:
        node = queue.popleft()
        steps.append({
            "current": node,
            "visited": list(visited_set),
            "frontier": list(queue),
            "description": f"BFS — Dequeue node {node}. Enqueue unvisited neighbours."
        })
        for neighbour in sorted(graph.get(node, [])):
            if neighbour not in visited_set:
                visited_set.add(neighbour)
                queue.append(neighbour)

    return steps


@app.route("/api/search", methods=["POST", "OPTIONS"])
@app.route("/", methods=["POST", "OPTIONS"])
def search():
    if request.method == "OPTIONS":
        return "", 204

    data = request.get_json(force=True)
    num_nodes = int(data.get("num_nodes", 6))
    edges = data.get("edges", [])
    start = int(data.get("start", 0))
    algorithm = data.get("algorithm", "dfs").lower()

    if start >= num_nodes:
        start = 0

    graph = build_adj(num_nodes, edges)

    if algorithm == "bfs":
        steps = run_bfs(graph, start, num_nodes)
    else:
        steps = run_dfs(graph, start, num_nodes)

    return jsonify({
        "steps": steps,
        "algorithm": algorithm.upper(),
        "total_steps": len(steps)
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)