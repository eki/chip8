
require 'json'


class Assembler

  attr_reader :source, :instructions, :labels, :meta

  def initialize( source )
    @source, @instructions, @labels, @meta = source, [], {}, {}

    addr = 0

    source.each_line do |line|
      if line =~ /^\s*(\w+):/
        labels[$1] = addr
      elsif line =~ /^\s*@(\w+):([^;]+)/
        meta[$1] = $2
      elsif line =~ /^\s*(;.*)?$/
        # blank or comment: nop
      else
        addr += (line =~ /^\s*[.#]{8}/) ? 1 : 2

        instructions << line
      end
    end
  end

  V = { 'v0' =>  0, 'v1' =>  1, 'v2' =>  2, 'v3' =>  3,
        'v4' =>  4, 'v5' =>  5, 'v6' =>  6, 'v7' =>  7,
        'v8' =>  8, 'v9' =>  9, 'va' => 10, 'vb' => 11,
        'vc' => 12, 'vd' => 13, 've' => 14, 'vf' => 15 }

  def hxyn( h, x, y, n )
    split_instruction( (h << 12) | (x << 8) | (y << 4) | n )
  end

  def hnnn( h, nnn )
    split_instruction( (h << 12) | nnn )
  end

  def hxkk( h, x, kk )
    split_instruction( (h << 12) | (x << 8) | kk )
  end

  def addr( label )
    labels[label] + 0x200
  end

  def split_instruction( n )
    [n >> 8, n & 0xff]
  end

  def bitmap( str )
    n = 0
    (0..7).each { |m| n |= 1 << (7-m)  if str[m] == '#' }
    n
  end

  def parse( instruction )
    op, a1, a2, a3 = instruction.strip.split( /\s+/ )

    case
      when op == 'sub'
        hxyn( 8, V[a1], V[a2], 5 )
      when op == 'add'
        hxyn( 8, V[a1], V[a2], 4 )
      when op == 'jp'
        hnnn( 1, addr( a1 ) )
      when op == 'se' && V[a1] && V[a2]
        hxyn( 5, V[a1], V[a2], 0 )
      when op == 'se' && V[a1] && a2 =~ /^\d+$/
        hxkk( 3, V[a1], a2.to_i )
      when op == 'sne' && V[a1] && V[a2]
        hxyn( 9, V[a1], V[a2], 0 )
      when op == 'sne' && V[a1] && a2 =~ /^\d+$/
        hxkk( 4, V[a1], a2.to_i )
      when op == 'ld' && a1 == 'i'
        hnnn( 0xa, addr( a2 ) )
      when op == 'ld' && a1 == 'dt' && V[a2]
        hxkk( 0xf, V[a2], 0x15 )
      when op == 'ld' && a2 == 'dt' && V[a1]
        hxkk( 0xf, V[a1], 0x07 )
      when op == 'ld' && V[a1] && V[a2]
        hxyn( 8, V[a1], V[a2], 0 )
      when op == 'ld' && a2 =~ /^\d+$/
        hxkk( 6, V[a1], a2.to_i )
      when op == 'drw'
        hxyn( 0xd, V[a1], V[a2], a3.to_i )
      when op =~ /([.#]{8})/
        bitmap( $1 )
      else
        raise "Unrecognized instruction: #{instruction}"
    end
  end

  def to_json
    h = meta.dup

    h[:program] = instructions.map { |str| parse( str ) }.flatten.compact

    h.to_json
  end
end

ARGV.each do |fn|
  basename = File.basename( fn, '.asm' )
  source   = nil

  open( fn, 'r' ) { |f| source = f.read }

  if source
    asm = Assembler.new( source )
    json = asm.to_json
    open( "#{basename}.json", 'w' ) { |f| f.puts( json ) }
  end
end

