
require 'json'

ARGV.each do |fn|
  json = nil
  open( fn, 'r' ) { |f| json = f.read }
  if json
    h = JSON.parse( json )
    program = h['program']
    i = 0
    while i < program.length
      puts ((program[i] << 8) + program[i+1]).to_s( 16 )
      i += 2
    end
  end
end

