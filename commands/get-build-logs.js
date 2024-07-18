import { writeFile, mkdir } from 'fs/promises';
import { resolve } from 'path';
import LogService from '../services/LogService.js';

export default async function getBuildLogs(options) {
    try {
      const output = options.output || ""
      const outputDir = resolve(output)
      console.log('fetching build jobs...')

      const logService = new LogService(options)

      const { branch } = options
      const jobs = (await logService.fetchBuildJobs(branch)).jobs

      if(!jobs.length){
          console.log('no logs found')
          return
      }
      console.log(`found ${jobs.length} jobs \ndownloading/extracting the latest ${options.numberOfJobs} job(s)`)

      await mkdir(outputDir, {recursive: true})

      for(let i = 0; i < options.numberOfJobs; i++){
        const jobId = jobs[i].jobId
        console.log(`fetching logs for JobId:${jobId}`)
        const job = await logService.fetchBuildJobLog(branch, jobId)
        const steps = job.steps

        for (let step of steps) {
          const stepName = step.stepName
          const stepStatus = step.status

          if (step.logUrl) {
            const file = await(await fetch(step.logUrl)).text()
            console.log(`JobId - ${jobId} | Step - ${stepName} | Status - ${stepStatus}... writing to file... `)
            await writeFile(`${outputDir}/JOB_${jobId}_${stepName}_${stepStatus}.txt`, file, { encoding: 'utf-8' })
          } else {
            console.log(`JobId - ${jobId} | Step - ${stepName} | Status - ${stepStatus}... no logs to write... `)
          }
        }
      }
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}