
(function( $ ) {
  var program, screen, memory, pc, I, V, DT, ST, stack, debug;

  var keys = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];

  var timer_interval;

  var init_sprites = [
    0xF0, 0x90, 0x90, 0x90, 0xF0, 0x00, 0x00, 0x00,
    0x20, 0x60, 0x20, 0x20, 0x70, 0x00, 0x00, 0x00,
    0xF0, 0x10, 0xF0, 0x80, 0xF0, 0x00, 0x00, 0x00,
    0xF0, 0x10, 0xF0, 0x10, 0xF0, 0x00, 0x00, 0x00,
    0x90, 0x90, 0xF0, 0x10, 0x10, 0x00, 0x00, 0x00,
    0xF0, 0x80, 0xF0, 0x10, 0xF0, 0x00, 0x00, 0x00,
    0xF0, 0x80, 0xF0, 0x90, 0xF0, 0x00, 0x00, 0x00,
    0xF0, 0x10, 0x20, 0x40, 0x40, 0x00, 0x00, 0x00,
    0xF0, 0x90, 0xF0, 0x90, 0xF0, 0x00, 0x00, 0x00,
    0xF0, 0x90, 0xF0, 0x10, 0xF0, 0x00, 0x00, 0x00,
    0xF0, 0x90, 0xF0, 0x90, 0x90, 0x00, 0x00, 0x00,
    0xE0, 0x90, 0xE0, 0x90, 0xE0, 0x00, 0x00, 0x00,
    0xF0, 0x80, 0x80, 0x80, 0xF0, 0x00, 0x00, 0x00,
    0xE0, 0x90, 0x90, 0x90, 0xE0, 0x00, 0x00, 0x00,
    0xF0, 0x80, 0xF0, 0x80, 0xF0, 0x00, 0x00, 0x00,
    0xF0, 0x80, 0xF0, 0x80, 0x80, 0x00, 0x00, 0x00
  ];

  function init( data ) {
    program = data;
    screen = new Array( 64 * 32 );
    memory = new Array( 0x1000 );
    pc = 0x0200;
    V = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
    DT = 0;
    ST = 0;
    stack = [];

    for( var i = 0; i < memory.length; i++ ) {
      memory[i] = 0;
    }

    for( var i = 0; i < init_sprites.length; i++ ) {
      memory[i+0x80] = init_sprites[i];
    }

    for( var i = 0; i < data.program.length; i++ ) {
      memory[i+0x200] = data.program[i];
    }

    for( var i = 0; i < screen.length; i++ ) {
      screen[i] = 0;
    }

    if( timer_interval ) {
      clearInterval( timer_interval );
    }

    timer_interval = setInterval( update_timers, 1000 / 60 );
  }

  function load( file ) {
    $.get( "games/" + file + ".json", {}, init, 'json' );
  }

  function step() {
    var   op = (memory[pc] << 8) + memory[pc+1];
    var    x = (op & 0x0f00) >>  8;
    var    y = (op & 0x00f0) >>  4;
    var    n = (op & 0x000f);
    var   kk = (op & 0x00ff);
    var  nnn = (op & 0x0fff);
    var    h = (op & 0xf000) >> 12;

    pc += 2;

    if( op == 0x00e0 ) {
      for( var i = 0; i < screen.length; i++ ) {
        screen[i] = 2;
      }
    }
    else if( op == 0x00ee ) {
      pc = stack.pop();
    }
    else {
      switch( h ) {
        case 0x1: pc = nnn;                                        break;
        case 0x2: stack.push( pc ); pc = nnn;                      break;
        case 0x3: pc += (V[x] == kk)   ? 2 : 0;                    break;
        case 0x4: pc += (V[x] != kk)   ? 2 : 0;                    break;
        case 0x5: pc += (V[x] == V[y]) ? 2 : 0;                    break;
        case 0x6: V[x] = kk;                                       break;
        case 0x7: V[x] += kk;                                      break;
        case 0x8:
          switch( n ) {
            case 0x0: V[x] = V[y];                                 break;
            case 0x1: V[x] |= V[y];                                break;
            case 0x2: V[x] &= V[y];                                break;
            case 0x3: V[x] ^= V[y];                                break;
            case 0x4:
              V[x] += V[y];
              if( V[x] > 255 ) {
                V[0xf] = 1;
                V[x] &= 0xff;
              }
              break;
            case 0x5:
              V[0xf] = V[x] > V[y] ? 1 : 0;
              V[x] -= V[y];
              V[x] &= 0xff;
              break;
            case 0x6:
              V[0xf] = V[x] & 1;
              V[x] >>= 1;
              break;
            case 0x7:
              V[0xf] = V[y] > V[x] ? 1 : 0;
              V[x] = V[y] - V[x];
              V[x] &= 0xff;
              break;
            case 0xe:
              V[0xf] = V[x] & 128;
              V[x] <<= 1;
              V[x] &= 0xff;
              break;
            default:
              throw "Invalid opcode: " + op;
          }
          break;
        case 0x9: 
          console.log( 'sne', x, y, V[x], V[y], V[x] != V[y], pc, pc + 2 );
          pc += (V[x] != V[y]) ? 2 : 0;                    break;
        case 0xa: I = nnn;                                         break;
        case 0xb: pc = V[0] + nnn;                                 break;
        case 0xc: V[x] = Math.floor( Math.random() * 256 ) & kk;   break;
        case 0xd:
          V[0xf] = 0;

          for( var j = 0; j < n; j++ ) {
            var b = memory[I+j];

            for( var i = 0; i < 8; i++ ) {
              var px = (V[x] + i) & 63;
              var py = (V[y] + j) & 31;
              var p  = (b & (0x80 >> i)) > 0 ? 1 : 0;
              var si = py * 64 + px;

              if( (screen[si] & 1) && p ) {
                V[0xf] = 1;
              }

              var sp = (screen[si] & 1) ^ p;

              if( sp != screen[si] ) {
                screen[si] = sp | 2;
              }
            }
          }

          break;
        case 0xe:
          if( kk == 0x9e ) {
            if( keys[V[x]] ) {
              pc += 2;
            }
          }
          else if( kk == 0xa1 ) {
            if( ! keys[V[x]] ) {
              pc += 2;
            }
          }
          else {
            throw "Invalid opcode: " + op;
          }
          break;
        case 0xf:
          switch( kk ) {
            case 0x07:
              V[x] = DT;
              break;
            case 0x0a:
              throw "Not implemented: WAIT FOR KEY PRESS";
              break;
            case 0x15:
              DT = V[x];
              break;
            case 0x18:
              ST = V[x];
              break;
            case 0x1e:
              I += V[x];
              I &= 0xfff;
              break;
            case 0x29:
              I = V[x] << 3;
              break;
            case 0x33:
              memory[I  ] = V[x] / 100 % 10;
              memory[I+1] = V[x] /  10 % 10;
              memory[I+2] = V[x]       % 10;
              break;
            case 0x55:
              for( var i = 0; i <= x; i++ ) {
                memory[I+i] = V[i];
              }
              break;
            case 0x65:
              for( var i = 0; i <= x; i++ ) {
                V[i] = memory[I+i];
              }
              break;
            default:
              throw "Invalid opcode: " + op;
          }
          break;
        default:
          throw "Invalid opcode: " + op;
      }
    }
  }

  function run( n ) {
    n = n || 100;
    for( var i = 0; i < n; i++ ) {
      step();
    }
  }

  function update_screen() {
    var canvas  = $('#screen').get( 0 );
    var context = canvas.getContext( '2d' );

    context.save();

    for( var i = 0; i < screen.length; i++ ) {
      if( screen[i] & 2 ) {
        var x = i % 64;
        var y = Math.floor( i / 64 );

        screen[i] &= 1;

        context.fillStyle = screen[i] ? '#000' : '#fff';
        context.fillRect( x * 8, y * 8, 8, 8 );
      }
    }

    context.restore();
  }

  function update_timers() {
    if( DT ) {
      DT -= 1;
    }

    if( ST ) {
      ST -= 1;
    }

    run( 12 );

    update_screen();
  }

  function update_key( k, v ) {
    switch( k ) {
      case 49:  keys[0x1] = v;  return false;  /* 1 */  /* 1234 => 123c */
      case 50:  keys[0x2] = v;  return false;  /* 2 */  /* qwer => 456d */
      case 51:  keys[0x3] = v;  return false;  /* 3 */  /* asdf => 789e */
      case 51:  keys[0xc] = v;  return false;  /* 4 */  /* zxcv => a0bf */

      case 81:  keys[0x4] = v;  return false;  /* q */
      case 87:  keys[0x5] = v;  return false;  /* w */
      case 69:  keys[0x6] = v;  return false;  /* e */
      case 82:  keys[0xd] = v;  return false;  /* r */

      case 65:  keys[0x7] = v;  return false;  /* a */
      case 83:  keys[0x8] = v;  return false;  /* s */
      case 68:  keys[0x9] = v;  return false;  /* d */
      case 70:  keys[0xe] = v;  return false;  /* f */

      case 90:  keys[0xa] = v;  return false;  /* z */
      case 88:  keys[0x0] = v;  return false;  /* x */
      case 67:  keys[0xb] = v;  return false;  /* c */
      case 86:  keys[0xf] = v;  return false;  /* v */
    }

    return true;
  }

  function on_keydown( event ) {
    return update_key( event.which, 1 );
  }

  function on_keyup( event ) {
    return update_key( event.which, 0 );
  }

  $(document).ready( function() {
    load( 'test1' );

    $(document).keydown( on_keydown );
    $(document).keyup( on_keyup );
  } );

  $.chip8 = {
    vm: function() {
      return {
        program: program,
        screen: screen,
        memory: memory,
        pc:     pc,
        I:      I,
        V:      V,
        DT:     DT,
        ST:     ST,
        stack:  stack
      };
    },
    load: function( file ) { load( file ) },
    debug: function( v ) { debug = v; }
  }

})( jQuery );

