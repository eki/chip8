
  ld  v0 28    ; start x for foo
  ld  v1  1    ; start y for foo
  ld  v2  1    ; vx for foo is 1px
  ld  v3  7    ; every ~ 1/8th of a second

  ld  v5  64
  ld  v6  31
  ld  v7   8

baseline:
  sub v5 v7
  ld i line
  drw v5 v6 1
  sne v5  0
  jp draw_foo
  jp baseline
 
  
draw_foo:
  ld  i  foo
  drw v0 v1 8

  ld  dt v3     ; start the timer

loop:
  ld  v4 dt
  se  v4  0
  jp  sleep
redraw:
  drw v0 v1 8
  add v0 v2
  drw v0 v1 8
  ld  dt v3
sleep:
  jp loop

foo:
  .######.
  #......#
  #.#..#.#
  #......#
  #.#..#.#
  #.####.#
  #......#
  .######.

line:
  ########
  ........

