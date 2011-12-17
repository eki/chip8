
require 'json'

ARGV.each do |fn|
  data = nil

  open( fn, 'r' ) do |f|
    data = f.read
  end

  ary = data.unpack( 'C*' )

  h = {
    program: ary,
    author: '',
    year: nil,
    description: ''
  }

  open( "#{fn.downcase}.json", 'w' ) do |f|
    f.puts h.to_json
  end
end

