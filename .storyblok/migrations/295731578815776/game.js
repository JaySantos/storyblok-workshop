export default function (block) {

  // if (block.release_quarter)
  //   block.release_quarter = block.release_quarter.toUpperCase();

  // delete block.release_date;

  if (block.name) {
    block.name = block.name.concat("[m]");
  }

  return block;
}
