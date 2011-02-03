task :default => ["wps_logger.xpi"]

file "wps_logger.xpi" do
  sh "jar cvf wps_logger.xpi content skin chrome.manifest install.rdf"
end

task :clean do
  if File.exists?("wps_logger.xpi")
    sh "rm wps_logger.xpi"
  end
end
