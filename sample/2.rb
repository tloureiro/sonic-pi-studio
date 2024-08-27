# live_loop :melodic_rhythm do
#     use_synth :prophet  # Sets the synthesizer to Prophet
#     play_pattern_timed [60, 64, 67, 72], [0.5, 0.5, 1, 1], release: 0.8  # Plays a series of notes with specific timings
  
#     sample :drum_bass_soft, amp: 0.5  # Plays a soft bass drum
#     sample :perc_snap, amp: 0.3       # Plays a snap percussion
#     sleep 2              
# end