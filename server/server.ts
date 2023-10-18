import express, { json } from 'express'
import cors from 'cors'
import { unlink } from 'node:fs/promises'
import { exec } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import { UUID, randomUUID } from 'node:crypto'

const app = express()
app.use(json())
app.use(cors())

class CompileExceptionError extends Error {
    constructor(message: string) {
        super(message)
    }
}

class ProblemService {
    private problempath: string
    private userproblemID: UUID;
    private prefix_problems: string = "./problems/"
    private runTestCommand: string
    private compileCommand: string

    constructor(
        problemID: string,
        private language: string,
        private code: string
    ) {
        this.userproblemID = randomUUID()
        this.problempath = this.prefix_problems + `problem-${problemID}`
        this.runTestCommand = `${this.problempath}/run.sh ${this.userproblemID}.bin`
        this.compileCommand = `g++ -O2 -o ${this.problempath}/${this.userproblemID}.bin ${this.problempath}/${this.userproblemID}.${this.language}`
    }

    public async saveFile() {
        await writeFile(`${this.problempath}/${this.userproblemID}.${this.language}`, this.code)
    }

    public execCommand(command: string) {
        return new Promise((resolve, rejects) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    rejects(error)
                }
                resolve({ stdout, stderr })
            })
        })
    }
    public async compileCpp() {
        try {
            await this.execCommand(this.compileCommand)
        } catch (error: any) {
            throw new CompileExceptionError(error.message as string)
        }
    }

    public async runTests() {
        await this.execCommand(this.runTestCommand)
    }

    public async clean() {
        try {
            await unlink(`${this.problempath}/${this.userproblemID}.bin`)
        } catch { }
        try {
            await unlink(`${this.problempath}/${this.userproblemID}.${this.language}`)
        } catch { }
    }
}

app.post('/submit-solution', async (request, response) => {
    const { language, problem_id, code } = request.body
    const problemService = new ProblemService(problem_id, language, code)
    try {
        await problemService.saveFile()
        let obj = await problemService.compileCpp()
        console.log(obj)
        obj = await problemService.runTests()
        console.log(obj)
        await problemService.clean()
        return response.status(200).json({
            status: "Accepted"
        })
    } catch (err) {
        await problemService.clean()
        if (err instanceof CompileExceptionError) {
            return response.status(400).json({
                status: "Compilation Error",
                error: err
            })
        }
        return response.status(400).json({
            status: "Wrong Answer",
            error: err
        })
    }
})


const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`)
})