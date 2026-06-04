const FileNode = require("../../models/fileNode");

async function buildSnapshot(workspaceId, rootFolderId) {
  // fetch ALL nodes for this workspace in one query
  const allNodes = await FileNode.find({ workspaceId }).lean();

  console.log("Total nodes fetched:", allNodes.length); // debug

  if (allNodes.length === 0) {
    throw new Error("No nodes found for this workspace");
  }

  // build lookup map by string id
  const nodeMap = {};
  for (const node of allNodes) {
    nodeMap[node._id.toString()] = node;
  }

  // verify root exists
  const rootNode = nodeMap[rootFolderId.toString()];
  if (!rootNode) {
    throw new Error(`Root folder ${rootFolderId} not found`);
  }

  console.log("Root node found:", rootNode.name); // debug

  // collect all descendants using parentId links (not children array)
  // this is more reliable since parentId is always set on every node
  const subtreeIds = new Set();
  subtreeIds.add(rootFolderId.toString());

  // keep looping until no new nodes are added
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of allNodes) {
      const nodeId = node._id.toString();
      const parentId = node.parentId?.toString();

      // if this node's parent is already in our subtree, add this node too
      if (!subtreeIds.has(nodeId) && parentId && subtreeIds.has(parentId)) {
        subtreeIds.add(nodeId);
        changed = true;
      }
    }
  }

  console.log("Nodes in subtree:", subtreeIds.size); // debug

  // build relative paths for every file in the subtree
  function getRelativePath(node) {
    const nodeId = node._id.toString();

    // this node is the root — no path prefix
    if (nodeId === rootFolderId.toString()) return "";

    const parentId = node.parentId?.toString();
    const parent = nodeMap[parentId];

    // parent is the root folder — just the filename
    if (parentId === rootFolderId.toString()) return node.name;

    // recurse up the tree
    const parentPath = getRelativePath(parent);
    return parentPath ? `${parentPath}/${node.name}` : node.name;
  }

  // build the fileMap from only files inside the subtree
  const fileMap = {};

  for (const id of subtreeIds) {
    const node = nodeMap[id];
    if (!node || node.type !== "file") continue;

    const relativePath = getRelativePath(node);
    fileMap[relativePath] = node.content || "";

    console.log("Added to fileMap:", relativePath); // debug
  }

  console.log("FileMap generated:", Object.keys(fileMap)); // debug

  return fileMap;
}

module.exports = { buildSnapshot };