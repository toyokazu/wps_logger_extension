task :default => ["wps_logger.xpi"]

file "wps_logger.xpi" do
  sh "jar -J-Dfile.encoding=UTF8 cvf wps_logger.xpi chrome chrome.manifest defaults install.rdf"
end

task :clean do
  if File.exists?("wps_logger.xpi")
    sh "rm wps_logger.xpi"
  end
end
